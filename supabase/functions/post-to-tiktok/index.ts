
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB minimum

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
      .select('access_token, tiktok_user_id')
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

    console.log('Posting to TikTok for user:', connection.tiktok_user_id);

    // Step 1: Query creator info (following official API docs)
    console.log('Querying creator info...');
    const creatorInfoResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    const creatorInfo = await creatorInfoResponse.json();
    console.log('Creator info response:', creatorInfo);

    if (!creatorInfoResponse.ok || creatorInfo.error?.code !== 'ok') {
      console.error('Failed to get creator info:', creatorInfo);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to get TikTok creator info',
          details: creatorInfo.error?.message || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Download the video to get its size
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    
    console.log('Video size:', videoSize, 'bytes');

    // Calculate chunk configuration
    let chunkSize = CHUNK_SIZE;
    let totalChunkCount = Math.ceil(videoSize / chunkSize);

    // For videos less than 5MB, upload as whole
    if (videoSize < MIN_CHUNK_SIZE) {
      chunkSize = videoSize;
      totalChunkCount = 1;
    }

    // Ensure we don't exceed 1000 chunks
    if (totalChunkCount > 1000) {
      chunkSize = Math.ceil(videoSize / 1000);
      totalChunkCount = Math.ceil(videoSize / chunkSize);
    }

    console.log('Upload configuration:', {
      videoSize,
      chunkSize,
      totalChunkCount
    });

    // Step 2: Initialize video upload (following official API docs)
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title limit
          privacy_level: "SELF_ONLY", // Start with private posts for safety
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
    console.log('Init response:', initData);

    if (!initResponse.ok || initData.error?.code !== 'ok') {
      console.error('Failed to initialize TikTok upload:', initData);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      // Check for scope authorization error specifically
      if (initData.error?.code === 'scope_not_authorized') {
        return new Response(
          JSON.stringify({ 
            error: 'TikTok authorization expired or insufficient permissions. Please reconnect your TikTok account with the video.publish scope.',
            details: 'The video.publish scope is required but not authorized. Please disconnect and reconnect your TikTok account.'
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
          details: initData.error?.message || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const publishId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;

    console.log('Upload initialized with publish_id:', publishId);

    // Step 3: Upload video in chunks
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
      
      console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunkCount}:`, {
        startByte,
        endByte,
        actualChunkSize,
        totalSize: videoSize
      });

      const chunkUploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': actualChunkSize.toString(),
          'Content-Range': `bytes ${startByte}-${endByte}/${videoSize}`,
        },
        body: chunkData,
      });

      console.log(`Chunk ${chunkIndex + 1} upload status:`, chunkUploadResponse.status);

      if (!chunkUploadResponse.ok) {
        const errorText = await chunkUploadResponse.text();
        console.error(`Failed to upload chunk ${chunkIndex + 1}:`, {
          status: chunkUploadResponse.status,
          statusText: chunkUploadResponse.statusText,
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

      // Check if this was the final chunk (status 201) or partial (status 206)
      if (chunkUploadResponse.status === 201) {
        console.log('All chunks uploaded successfully');
        break;
      } else if (chunkUploadResponse.status === 206) {
        console.log(`Chunk ${chunkIndex + 1} uploaded, continuing...`);
      } else {
        console.warn(`Unexpected status code ${chunkUploadResponse.status} for chunk ${chunkIndex + 1}`);
      }
    }

    console.log('Video upload completed, checking publish status...');

    // Step 4: Check publish status (following official API docs)
    const checkStatus = async (retries = 0): Promise<any> => {
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          publish_id: publishId
        }),
      });

      const statusData = await statusResponse.json();
      console.log('Publish status response:', statusData);

      if (!statusResponse.ok || statusData.error?.code !== 'ok') {
        throw new Error(`Status check failed: ${statusData.error?.message || 'Unknown error'}`);
      }

      const status = statusData.data?.status;
      
      // If still processing and we haven't retried too many times, wait and try again
      if ((status === 'PROCESSING_UPLOAD' || status === 'PROCESSING_PUBLISH') && retries < 10) {
        console.log(`Status is ${status}, waiting before retry ${retries + 1}/10...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
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
          status: finalStatus.data?.status || 'posted',
          share_url: finalStatus.data?.publiclyAvailable?.share_url
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('Publish failed or timed out:', finalStatus);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to publish TikTok post',
          details: finalStatus.data?.status || 'Unknown publish status',
          status: finalStatus.data?.status
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
