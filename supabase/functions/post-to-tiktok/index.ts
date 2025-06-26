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

    console.log(`Attempting to post media for scheduledPostId: ${scheduledPostId}`);
    console.log(`Media URL: ${videoUrl}`);

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

    // Get the media type from the scheduled post to determine if it's a photo or video
    let mediaType = 'video'; // default to video for backwards compatibility
    if (scheduledPostId) {
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .select('media_type')
        .eq('id', scheduledPostId)
        .eq('user_id', user.id)
        .single();
      
      if (!postError && postData?.media_type) {
        mediaType = postData.media_type;
      }
    }

    console.log(`Media type: ${mediaType}`);

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

    let initUploadResponse;
    let requestBody;

    if (mediaType === 'photo') {
      // Use TikTok's photo posting API
      console.log('Initializing TikTok photo post...');
      
      requestBody = {
        post_info: {
          title: caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: [videoUrl], // Using videoUrl parameter name for compatibility, but it's actually an image URL
        },
        media_type: 'PHOTO',
        post_mode: 'DIRECT_POST',
      };

      initUploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(requestBody),
      });
    } else {
      // Use TikTok's video posting API (original logic)
      console.log('Initializing TikTok video direct post with PULL_FROM_URL...');
      
      requestBody = {
        post_info: {
          title: caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl, // Must be a public, verified domain
        },
      };

      initUploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(requestBody),
      });
    }

    console.log(`Request body for TikTok ${mediaType} init:`, JSON.stringify(requestBody, null, 2));

    const initUploadData = await initUploadResponse.json();
    console.log(`TikTok init ${mediaType} response status:`, initUploadResponse.status);
    console.log(`TikTok init ${mediaType} response data:`, initUploadData);

    if (!initUploadResponse.ok || initUploadData.error?.code !== 'ok' || !initUploadData.data) {
      // Log the full response body for debugging
      const errorText = JSON.stringify(initUploadData, null, 2);
      console.error(`TikTok ${mediaType} upload initialization failed. Full response:`, errorText);
      throw new Error(`TikTok ${mediaType} upload initialization failed: ${initUploadData.error?.message || initUploadResponse.statusText || `The ${mediaType} info is empty (no data object from TikTok).`}`);
    }

    const publish_id = initUploadData.data.publish_id;
    console.log(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} upload initialized. Publish ID: ${publish_id}`);

    // Update scheduled post status to indicate it's being processed by TikTok
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({ 
        status: 'posted', // Assuming 'posted' means successfully sent to TikTok for review
        tiktok_publish_id: publish_id, // Store publish_id for webhook tracking
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduledPostId);

    if (updateError) {
      console.error('Error updating scheduled post status:', updateError);
    }

    return new Response(JSON.stringify({
      message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sent to TikTok for processing`,
      publishId: publish_id,
      mediaType: mediaType,
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