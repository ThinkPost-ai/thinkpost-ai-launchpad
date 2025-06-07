import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let scheduledPostId: string | undefined; // Declare scheduledPostId outside try block

  try {
    const { videoUrl, caption, scheduledPostId: reqScheduledPostId } = await req.json();
    scheduledPostId = reqScheduledPostId; // Assign the value here

    console.log(`Attempting to post video for scheduledPostId: ${scheduledPostId}`);
    console.log(`Video URL: ${videoUrl}`);

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use anon key for client-side functionality
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    // Authenticate the user to get their ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated or not found.');
    }

    // Fetch TikTok access token from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tiktok_access_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tiktok_access_token) {
      throw new Error('TikTok access token is missing in user profile. Please connect your TikTok account.');
    }

    const tiktokAccessToken = profile.tiktok_access_token;

    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!client_key || !client_secret) {
      throw new Error('TikTok client credentials are not set in environment variables.');
    }

    // Fetch the video from Supabase Storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok || !videoResponse.body) {
      throw new Error(`Failed to fetch video from URL: ${videoResponse.statusText}`);
    }

    const videoSize = parseInt(videoResponse.headers.get('Content-Length') || '0');
    if (videoSize === 0) {
      throw new Error('Fetched video has zero size.');
    }

    // 1. Initialize video upload with TikTok (Direct Post)
    console.log('Initializing TikTok video direct post with FILE_UPLOAD...');
    const initUploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tiktokAccessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          // TikTok recommends chunk_size around 10MB. For simplicity, we'll assume one chunk for now.
          // For larger videos, this needs to be properly chunked.
          total_chunk_count: 1,
        },
      }),
    });

    console.log('Request body for TikTok video init:', JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: 'SELF_ONLY',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }, null, 2));

    const initUploadData = await initUploadResponse.json();
    console.log('TikTok init upload response status:', initUploadResponse.status);
    console.log('TikTok init upload response data:', initUploadData);

    if (!initUploadResponse.ok || initUploadData.error?.code !== 'ok' || !initUploadData.data) {
      throw new Error(`TikTok video upload initialization failed: ${initUploadData.error?.message || initUploadResponse.statusText || 'The video info is empty (no data object from TikTok).'}`);
    }

    const publish_id = initUploadData.data.publish_id;
    const upload_url = initUploadData.data.upload_url; // Get upload_url for the next step
    console.log(`Video upload initialized. Publish ID: ${publish_id}, Upload URL: ${upload_url}`);

    // 2. Upload the video file to the received upload_url
    console.log('Uploading video to TikTok...');
    const uploadVideoResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': videoResponse.headers.get('Content-Type') || 'video/mp4',
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: videoResponse.body, // Stream the video body directly
    });

    if (!uploadVideoResponse.ok) {
      const uploadErrorText = await uploadVideoResponse.text();
      throw new Error(`TikTok video upload failed: ${uploadVideoResponse.status} - ${uploadErrorText}`);
    }

    console.log('Video uploaded to TikTok successfully.');

    // Update scheduled post status to indicate it's being processed by TikTok
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({ status: 'posted' }) // Assuming 'posted' means successfully sent to TikTok for review
      .eq('id', scheduledPostId);

    if (updateError) {
      console.error('Error updating scheduled post status:', updateError);
    }

    return new Response(JSON.stringify({
      message: 'Video sent to TikTok for processing',
      publishId: publish_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in post-to-tiktok function:', error);

    // Update scheduled post status to failed on error, only if scheduledPostId is defined
    if (scheduledPostId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', scheduledPostId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 