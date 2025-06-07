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

  try {
    const { scheduledPostId, videoUrl, caption, tiktokAccessToken } = await req.json();

    console.log(`Attempting to post video for scheduledPostId: ${scheduledPostId}`);
    console.log(`Video URL: ${videoUrl}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!tiktokAccessToken) {
      throw new Error('TikTok access token is missing.');
    }

    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!client_key || !client_secret) {
      throw new Error('TikTok client credentials are not set in environment variables.');
    }

    // 1. Initialize video upload with TikTok (Direct Post)
    console.log('Initializing TikTok video direct post...');
    const initUploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tiktokAccessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    });

    const initUploadData = await initUploadResponse.json();
    console.log('TikTok init upload response status:', initUploadResponse.status);
    console.log('TikTok init upload response data:', initUploadData);

    if (!initUploadResponse.ok || initUploadData.error?.code !== 'ok') {
      throw new Error(`TikTok video upload initialization failed: ${initUploadData.error?.message || initUploadResponse.statusText}`);
    }

    const publish_id = initUploadData.data.publish_id;
    console.log(`Video upload initialized. Publish ID: ${publish_id}`);

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

    // Update scheduled post status to failed on error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await supabase
      .from('scheduled_posts')
      .update({ status: 'failed' })
      .eq('id', scheduledPostId);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 