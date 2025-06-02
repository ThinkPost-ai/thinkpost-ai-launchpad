
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      return new Response(
        JSON.stringify({ error: 'TikTok connection not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Posting to TikTok for user:', connection.tiktok_user_id);

    // Step 1: Create post
    const createPostResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
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
          video_size: 0, // Will be updated after upload
          chunk_size: 10000000,
          total_chunk_count: 1
        }
      }),
    });

    const createPostData = await createPostResponse.json();
    console.log('Create post response:', createPostData);

    if (!createPostResponse.ok || createPostData.error?.code !== 'ok') {
      console.error('Failed to create TikTok post:', createPostData);
      
      // Update scheduled post status to failed
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create TikTok post',
          details: createPostData.error?.message || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const publishId = createPostData.data.publish_id;
    const uploadUrl = createPostData.data.upload_url;

    console.log('TikTok post created successfully with publish_id:', publishId);

    // Step 2: Upload video (simplified - assuming video is accessible via URL)
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoBuffer.byteLength - 1}/${videoBuffer.byteLength}`,
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      console.error('Failed to upload video:', uploadResponse.status, uploadResponse.statusText);
      
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ error: 'Failed to upload video to TikTok' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Video uploaded successfully');

    // Step 3: Confirm and publish
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId
      }),
    });

    const publishData = await publishResponse.json();
    console.log('Publish status response:', publishData);

    if (publishResponse.ok && publishData.data?.status === 'PROCESSING_UPLOAD') {
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
          status: publishData.data?.status || 'posted'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to publish TikTok post',
          details: publishData.error?.message || 'Unknown publish error'
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
