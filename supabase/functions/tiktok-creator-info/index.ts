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

    // Update tokens in secure user_oauth_tokens table
    const { error: updateError } = await supabase
      .from('user_oauth_tokens')
      .update({
        tiktok_access_token: access_token,
        tiktok_refresh_token: new_refresh_token || refreshToken,
        tiktok_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    // Also update expiration in profiles for quick reference
    await supabase
      .from('profiles')
      .update({
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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching TikTok creator info for user:', user.id);

    // Fetch TikTok access token from secure user_oauth_tokens table
    const { data: tokens, error: tokensError } = await supabase
      .from('user_oauth_tokens')
      .select('tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokensError || !tokens?.tiktok_access_token) {
      return new Response(
        JSON.stringify({ error: 'TikTok access token is missing. Please connect your TikTok account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also fetch username from profiles for display
    const { data: profile } = await supabase
      .from('profiles')
      .select('tiktok_username')
      .eq('id', user.id)
      .single();

    let tiktokAccessToken = tokens.tiktok_access_token;

    // Check if token is expired or will expire soon (within 1 hour)
    if (tokens.tiktok_token_expires_at && tokens.tiktok_refresh_token) {
      const expiresAt = new Date(tokens.tiktok_token_expires_at);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (expiresAt <= oneHourFromNow) {
        console.log('🔄 TikTok access token is expired or expires soon, refreshing...');
        const refreshedToken = await refreshTikTokToken(supabase, user.id, tokens.tiktok_refresh_token);
        
        if (refreshedToken) {
          tiktokAccessToken = refreshedToken;
          console.log('✅ Using refreshed TikTok access token');
        } else {
          return new Response(
            JSON.stringify({ error: 'Failed to refresh TikTok access token. Please reconnect your TikTok account.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log('Fetching creator info from TikTok API...');

    // Fetch creator info from TikTok API
    const creatorInfoResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tiktokAccessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    const creatorInfoData = await creatorInfoResponse.json();
    console.log('TikTok creator info response status:', creatorInfoResponse.status);
    console.log('TikTok creator info response data:', creatorInfoData);

    if (!creatorInfoResponse.ok || creatorInfoData.error?.code !== 'ok') {
      const errorText = JSON.stringify(creatorInfoData, null, 2);
      console.error('TikTok creator info fetch failed. Full response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch creator info: ${creatorInfoData.error?.message || 'Unknown error'}`,
          details: creatorInfoData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creatorInfo = creatorInfoData.data;

    // Ensure only the main 3 privacy options are available according to TikTok guidelines
    let privacyOptions = creatorInfo.privacy_level_options || [];
    
    // Filter to only include the main 3 privacy levels and remove redundant options
    const allowedOptions = ['SELF_ONLY', 'MUTUAL_FOLLOW_FRIENDS', 'PUBLIC_TO_EVERYONE'];
    privacyOptions = privacyOptions.filter(option => allowedOptions.includes(option));
    
    // Ensure all three main privacy levels are available
    allowedOptions.forEach(option => {
      if (!privacyOptions.includes(option)) {
        privacyOptions.push(option);
      }
    });

    return new Response(JSON.stringify({
      success: true,
      creatorInfo: {
        username: profile.tiktok_username,
        display_name: creatorInfo.creator_nickname || profile.tiktok_username,
        can_post: true, // TikTok API doesn't always return this field reliably
        max_video_post_duration_sec: creatorInfo.max_video_post_duration_sec || 180, // Default 3 minutes
        privacy_level_options: privacyOptions,
        comment_disabled: creatorInfo.comment_disabled || false,
        duet_disabled: creatorInfo.duet_disabled || false,
        stitch_disabled: creatorInfo.stitch_disabled || false,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in tiktok-creator-info function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
