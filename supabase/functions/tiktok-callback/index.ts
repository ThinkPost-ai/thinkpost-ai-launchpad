
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("🟡 TikTok callback function hit");
  console.log("Request URL:", req.url);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    console.log("🔑 code:", code);
    console.log("🧩 state:", state);

    if (!code || !state) {
      console.error('❌ Missing code or state from TikTok');
      return new Response('Missing parameters', { 
        status: 400,
        headers: corsHeaders
      })
    }

    // Use correct environment variable names
    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const redirect_uri = 'https://thinkpost.co/tiktok-callback';

    console.log("🔑 TikTok client_key:", client_key);
    console.log("🔁 TikTok redirect_uri:", redirect_uri);

    if (!client_key || !client_secret) {
      console.error("❌ Missing TikTok keys in env");
      return new Response("Missing TikTok keys in env", { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Use service role key for all database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("🔍 Validating state parameter");

    // Validate state (CSRF protection)
    const { data: stateData, error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .select('user_id')
      .eq('state_value', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateData) {
      console.error('❌ Invalid or expired state parameter:', stateError)
      return new Response('Invalid state', { 
        status: 400,
        headers: corsHeaders
      })
    }

    console.log("✅ State validation successful, user_id:", stateData.user_id);

    // Prepare token exchange payload
    const tokenPayload = new URLSearchParams({
      client_key,
      client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri
    });

    console.log('📤 Sending token payload to TikTok:', tokenPayload.toString());

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenPayload
    })

    const tokenText = await tokenResponse.text();
    console.log('📥 TikTok token response:', tokenText);

    if (!tokenResponse.ok) {
      console.error('❌ Failed to exchange token with TikTok');
      return new Response('Token exchange failed', { 
        status: 500,
        headers: corsHeaders
      })
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (parseError) {
      console.error('❌ Failed to parse TikTok token response:', parseError);
      return new Response('Invalid token response', { 
        status: 500,
        headers: corsHeaders
      })
    }

    const { access_token, open_id } = tokenData;

    console.log('✅ Token exchange successful');
    console.log('🔍 Access token:', access_token ? 'present' : 'missing');
    console.log('🔍 Open ID:', open_id ? 'present' : 'missing');

    if (!access_token || !open_id) {
      console.error('❌ Invalid token response from TikTok - missing access_token or open_id');
      return new Response('Invalid token response', { 
        status: 500,
        headers: corsHeaders
      })
    }

    // Fetch user info from TikTok with proper authorization header
    let username = null
    let avatarUrl = null

    try {
      console.log('📤 Fetching user info from TikTok');
      const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const userInfoText = await userInfoResponse.text();
      console.log('🎯 User info response:', userInfoText);

      if (userInfoResponse.ok) {
        try {
          const userInfo = JSON.parse(userInfoText);
          username = userInfo.data?.user?.display_name
          avatarUrl = userInfo.data?.user?.avatar_url
          console.log('✅ User info extracted - username:', username, 'avatar:', avatarUrl ? 'present' : 'missing');
        } catch (parseError) {
          console.error('❌ Failed to parse user info response:', parseError);
        }
      } else {
        console.error('❌ Failed to fetch user info from TikTok');
      }
    } catch (userInfoError) {
      console.error('❌ Error fetching user info:', userInfoError)
    }

    console.log('📤 Updating user profile in database');

    // Update user profile with TikTok data
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        tiktok_open_id: open_id,
        tiktok_username: username,
        tiktok_avatar_url: avatarUrl,
        tiktok_access_token: access_token,
        tiktok_connected: true
      })
      .eq('id', stateData.user_id)

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return new Response('Profile update failed', { 
        status: 500,
        headers: corsHeaders
      })
    }

    console.log('✅ Profile updated successfully');

    // Clean up the OAuth state
    console.log('📤 Cleaning up OAuth state');
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_value', state)

    console.log('✅ TikTok account connected successfully');
    console.log('🎉 TikTok connection successful for user:', stateData.user_id)

    // Redirect to dashboard with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://thinkpost.co/tiktok-login-callback?tiktok=connected',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in TikTok callback:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    })
  }
})
