
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('TikTok post function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { scheduledPostId, videoUrl, caption } = await req.json();

    if (!scheduledPostId || !videoUrl || !caption) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: scheduledPostId, videoUrl, caption' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get TikTok connection for the user
    const { data: connection, error: connectionError } = await supabase
      .from('tiktok_connections')
      .select('access_token, refresh_token, tiktok_user_id, token_expires_at, scope')
      .eq('user_id', user.id)
      .maybeSingle();

    if (connectionError || !connection) {
      console.error('TikTok connection not found:', connectionError);
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ error: 'TikTok connection not found. Please reconnect your TikTok account.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token needs refresh
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    let accessToken = connection.access_token;

    if (expiresAt <= oneHourFromNow) {
      console.log('Token expires soon, refreshing...');
      
      try {
        const refreshResult = await supabase.functions.invoke('refresh-tiktok-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (refreshResult.error) {
          throw new Error(refreshResult.error.message);
        }

        // Get updated connection
        const { data: updatedConnection } = await supabase
          .from('tiktok_connections')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (updatedConnection) {
          accessToken = updatedConnection.access_token;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        await supabase
          .from('scheduled_posts')
          .update({ status: 'failed' })
          .eq('id', scheduledPostId);

        return new Response(
          JSON.stringify({ 
            error: 'Token refresh failed. Please reconnect your TikTok account.',
            requires_reconnection: true
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Verify scope permissions
    if (!connection.scope || !connection.scope.includes('video.publish')) {
      console.error('Missing video.publish scope');
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'TikTok connection missing video publishing permissions. Please reconnect your account.',
          missing_scope: 'video.publish',
          current_scopes: connection.scope
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Starting TikTok post workflow for user:', connection.tiktok_user_id);

    // Step 1: Query creator info to validate account and get posting capabilities
    console.log('Step 1: Querying creator info...');
    const creatorInfoResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    const creatorInfo = await creatorInfoResponse.json();
    console.log('Creator info response:', {
      status: creatorInfoResponse.status,
      error_code: creatorInfo.error?.code,
      privacy_levels: creatorInfo.data?.privacy_level_options
    });

    if (!creatorInfoResponse.ok || creatorInfo.error?.code !== 'ok') {
      console.error('Failed to get creator info:', creatorInfo);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get TikTok creator info',
          details: creatorInfo.error?.message || 'Account may not be eligible for Content Posting API',
          tiktok_error: creatorInfo.error?.code
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Download and validate the video
    console.log('Downloading video from:', videoUrl);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    
    console.log('Video downloaded, size:', videoSize, 'bytes');

    // Validate video size (TikTok has limits)
    const maxVideoSize = 4 * 1024 * 1024 * 1024; // 4GB limit
    if (videoSize > maxVideoSize) {
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Video file too large',
          details: `Video size (${Math.round(videoSize / 1024 / 1024)}MB) exceeds TikTok's limit`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate chunk configuration
    let chunkSize = CHUNK_SIZE;
    let totalChunkCount = Math.ceil(videoSize / chunkSize);

    // Ensure we don't exceed 1000 chunks (TikTok limit)
    if (totalChunkCount > 1000) {
      chunkSize = Math.ceil(videoSize / 1000);
      totalChunkCount = Math.ceil(videoSize / chunkSize);
    }

    // For small videos, upload as single chunk
    if (videoSize <= chunkSize) {
      chunkSize = videoSize;
      totalChunkCount = 1;
    }

    console.log('Upload configuration:', {
      videoSize,
      chunkSize,
      totalChunkCount
    });

    // Step 2: Initialize video upload
    console.log('Step 2: Initializing video upload...');
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title limit
          privacy_level: "SELF_ONLY", // Start with private for safety
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount
        }
      }),
    });

    const initData = await initResponse.json();
    console.log('Init response:', {
      status: initResponse.status,
      error_code: initData.error?.code,
      publish_id: initData.data?.publish_id ? '[REDACTED]' : undefined
    });

    if (!initResponse.ok || initData.error?.code !== 'ok') {
      console.error('Failed to initialize TikTok upload:', initData);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      if (initData.error?.code === 'scope_not_authorized') {
        return new Response(
          JSON.stringify({ 
            error: 'TikTok authorization insufficient. Please reconnect your account with video publishing permissions.',
            requires_reconnection: true,
            missing_scope: 'video.publish'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize TikTok upload',
          details: initData.error?.message || 'Unknown error',
          tiktok_error: initData.error?.code
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const publishId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;

    console.log('Upload initialized with publish_id');

    // Step 3: Upload video in chunks
    console.log('Step 3: Uploading video in chunks...');
    const videoUint8Array = new Uint8Array(videoBuffer);
    
    for (let chunkIndex = 0; chunkIndex < totalChunkCount; chunkIndex++) {
      const startByte = chunkIndex * chunkSize;
      let endByte = startByte + chunkSize - 1;
      
      // For the last chunk, include any remaining bytes
      if (chunkIndex === totalChunkCount - 1) {
        endByte = videoSize - 1;
      }
      
      const actualChunkSize = endByte - startByte + 1;
      const chunkData = videoUint8Array.slice(startByte, endByte + 1);
      
      console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunkCount}: ${actualChunkSize} bytes`);

      const chunkUploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': actualChunkSize.toString(),
          'Content-Range': `bytes ${startByte}-${endByte}/${videoSize}`,
        },
        body: chunkData,
      });

      if (!chunkUploadResponse.ok) {
        const errorText = await chunkUploadResponse.text();
        console.error(`Failed to upload chunk ${chunkIndex + 1}:`, {
          status: chunkUploadResponse.status,
          error: errorText
        });
        
        await supabase
          .from('scheduled_posts')
          .update({ status: 'failed' })
          .eq('id', scheduledPostId);

        return new Response(
          JSON.stringify({ 
            error: `Failed to upload video chunk ${chunkIndex + 1}`,
            details: `HTTP ${chunkUploadResponse.status}: ${errorText}`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`Chunk ${chunkIndex + 1} uploaded successfully (status: ${chunkUploadResponse.status})`);
    }

    console.log('Video upload completed');

    // Step 4: Check publish status with retry logic
    console.log('Step 4: Checking publish status...');
    
    const checkStatus = async (retries = 0): Promise<any> => {
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          publish_id: publishId
        }),
      });

      const statusData = await statusResponse.json();
      console.log(`Status check ${retries + 1}:`, {
        status: statusResponse.status,
        publish_status: statusData.data?.status,
        error_code: statusData.error?.code
      });

      if (!statusResponse.ok || statusData.error?.code !== 'ok') {
        throw new Error(`Status check failed: ${statusData.error?.message || 'Unknown error'}`);
      }

      const status = statusData.data?.status;
      
      // If still processing and we haven't retried too many times, wait and try again
      if ((status === 'PROCESSING_UPLOAD' || status === 'PROCESSING_PUBLISH') && retries < 15) {
        console.log(`Status is ${status}, waiting before retry ${retries + 1}/15...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        return checkStatus(retries + 1);
      }
      
      return statusData;
    };

    const finalStatus = await checkStatus();

    if (finalStatus.data?.status === 'PUBLISH_COMPLETE') {
      // Update scheduled post status to posted
      await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'posted',
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduledPostId);

      console.log('TikTok post published successfully');

      return new Response(
        JSON.stringify({
          success: true,
          publish_id: publishId,
          status: finalStatus.data?.status,
          share_url: finalStatus.data?.publiclyAvailable?.share_url
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('Publish failed or timed out:', finalStatus.data?.status);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to publish TikTok post',
          details: `Final status: ${finalStatus.data?.status}`,
          publish_status: finalStatus.data?.status,
          fail_reason: finalStatus.data?.fail_reason
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('TikTok post error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
