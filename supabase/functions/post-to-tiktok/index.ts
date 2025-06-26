import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to refresh TikTok access token
async function refreshTikTokToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
  const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
  const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');

  if (!client_key || !client_secret) {
    console.error('TikTok client credentials missing for token refresh');
    return null;
  }

  try {
    console.log('🔄 Refreshing TikTok access token...');
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key,
        client_secret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token refresh failed:', errorText);
      return null;
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenData;

    if (!access_token) {
      console.error('❌ No access token in refresh response');
      return null;
    }

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Update the database with new tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        tiktok_access_token: access_token,
        tiktok_refresh_token: new_refresh_token || refreshToken, // Use new refresh token if provided
        tiktok_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to update tokens in database:', updateError);
      return null;
    }

    console.log('✅ TikTok access token refreshed successfully');
    return access_token;
  } catch (error) {
    console.error('❌ Error during token refresh:', error);
    return null;
  }
}

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
      .select('tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tiktok_access_token) {
      throw new Error('TikTok access token is missing in user profile. Please connect your TikTok account.');
    }

    let tiktokAccessToken = profile.tiktok_access_token;

    // Check if token is expired or will expire soon (within 1 hour)
    if (profile.tiktok_token_expires_at && profile.tiktok_refresh_token) {
      const expiresAt = new Date(profile.tiktok_token_expires_at);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour buffer

      if (expiresAt <= oneHourFromNow) {
        console.log('🔄 TikTok access token is expired or expires soon, refreshing...');
        const refreshedToken = await refreshTikTokToken(supabase, user.id, profile.tiktok_refresh_token);
        
        if (refreshedToken) {
          tiktokAccessToken = refreshedToken;
          console.log('✅ Using refreshed TikTok access token');
        } else {
          throw new Error('Failed to refresh TikTok access token. Please reconnect your TikTok account.');
        }
      } else {
        console.log('✅ TikTok access token is still valid');
      }
    } else {
      console.log('⚠️ No expiration time or refresh token found - using existing token');
    }

    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!client_key || !client_secret) {
      throw new Error('TikTok client credentials are not set in environment variables.');
    }

    let initUploadResponse;
    let requestBody;

    if (mediaType === 'photo') {
      // Use TikTok's photo posting API - Official format from TikTok documentation
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
          photo_cover_index: 1,
          photo_images: [videoUrl], // Official TikTok API format - using videoUrl parameter for compatibility
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
    if (scheduledPostId) {
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