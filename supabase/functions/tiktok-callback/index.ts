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

    console.log("🔑 Code received:", code ? 'Yes' : 'No');
    console.log("🧩 State received:", state ? 'Yes' : 'No');

    if (!code || !state) {
      console.error('❌ Missing code or state from TikTok');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=missing_parameters',
          ...corsHeaders
        }
      })
    }

    // Get environment variables
    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    const client_secret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const redirect_uri = 'https://thinkpost.co/tiktok-callback';

    console.log("🔑 TikTok client_key:", client_key ? 'Present' : 'Missing');
    console.log("🔁 TikTok redirect_uri:", redirect_uri);

    if (!client_key || !client_secret) {
      console.error("❌ Missing TikTok credentials in environment");
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=internal_error',
          ...corsHeaders
        }
      });
    }

    // Use service role key for database operations
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
      console.error('❌ Invalid or expired state parameter:', stateError?.message);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=invalid_state',
          ...corsHeaders
        }
      })
    }

    console.log("✅ State validation successful, user_id:", stateData.user_id);

    // Prepare token exchange request
    const tokenRequestBody = new URLSearchParams({
      client_key,
      client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri
    });

    console.log('📤 Exchanging code for access token');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: tokenRequestBody.toString()
    })

    const tokenResponseText = await tokenResponse.text();
    console.log('📥 TikTok token response status:', tokenResponse.status);
    console.log('📥 TikTok token response (raw text):', tokenResponseText);

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed with status:', tokenResponse.status);
      let errorDetails = '';
      try {
        const errorJson = JSON.parse(tokenResponseText);
        if (errorJson.error) errorDetails += `Error: ${errorJson.error}. `;
        if (errorJson.error_description) errorDetails += `Description: ${errorJson.error_description}`;
      } catch (e) {
        errorDetails = `Could not parse error response: ${tokenResponseText}`;
      }
      console.error('Detailed token exchange error:', errorDetails);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://thinkpost.co/tiktok-login-callback?error=token_exchange_failed&details=${encodeURIComponent(errorDetails)}`,
          ...corsHeaders
        }
      })
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (parseError) {
      console.error('❌ Failed to parse token response:', parseError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=invalid_token_response',
          ...corsHeaders
        }
      })
    }

    const { access_token, open_id, expires_in } = tokenData;

    console.log('🔍 Token data received:');
    console.log('- Access token:', access_token ? 'Present' : 'Missing');
    console.log('- Open ID:', open_id ? 'Present' : 'Missing');
    console.log('- Expires in:', expires_in);

    if (!access_token || !open_id) {
      console.error('❌ Missing required token data');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=invalid_token_response',
          ...corsHeaders
        }
      })
    }

    // Extract refresh token and calculate expiration time
    const { refresh_token, refresh_expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000); // expires_in is in seconds

    console.log('🔍 Additional token data:');
    console.log('- Refresh token:', refresh_token ? 'Present' : 'Missing');
    console.log('- Token expires at:', expiresAt.toISOString());

    // Fetch user information from TikTok
    let username = null;
    let avatarUrl = null;

    try {
      console.log('📤 Fetching user info from TikTok API');
      
      const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const userInfoText = await userInfoResponse.text();
      console.log('📥 User info response status:', userInfoResponse.status);
      console.log('📥 User info response (raw text):', userInfoText);

      if (userInfoResponse.ok) {
        try {
          const userInfo = JSON.parse(userInfoText);
          if (userInfo.data && userInfo.data.user) {
            username = userInfo.data.user.display_name;
            avatarUrl = userInfo.data.user.avatar_url;
            console.log('✅ User info extracted - username:', username, 'avatar:', avatarUrl ? 'present' : 'missing');
          } else {
            console.error('❌ User info data or user object is missing in response.');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse user info:', parseError);
        }
      } else {
        console.error('❌ Failed to fetch user info, status:', userInfoResponse.status);
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(userInfoText);
          if (errorJson.error) errorDetails += `Error: ${errorJson.error}. `;
          if (errorJson.message) errorDetails += `Message: ${errorJson.message}`;
        } catch (e) {
          errorDetails = `Could not parse error response: ${userInfoText}`;
        }
        console.error('Detailed user info fetch error:', errorDetails);
      }
    } catch (userInfoError) {
      console.error('❌ Error fetching user info:', userInfoError);
    }

    console.log('📤 Updating user profile in database');

    // Update user profile with TikTok data (metadata only, no tokens)
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({
        tiktok_open_id: open_id,
        tiktok_username: username,
        tiktok_avatar_url: avatarUrl,
        tiktok_token_expires_at: expiresAt.toISOString(),
        tiktok_connected: true
      })
      .eq('id', stateData.user_id)

    if (updateProfileError) {
      console.error('❌ Profile update error:', updateProfileError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://thinkpost.co/dashboard?error=profile_update_failed`
        }
      })
    }

    // Store OAuth tokens securely in user_oauth_tokens table
    console.log('🔒 Storing OAuth tokens securely...')
    const { error: updateError } = await supabaseClient
      .from('user_oauth_tokens')
      .upsert({
        user_id: stateData.user_id,
        tiktok_access_token: access_token,
        tiktok_refresh_token: refresh_token,
        tiktok_connected: true,
        tiktok_open_id: open_id,
        tiktok_username: username,
        tiktok_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://thinkpost.co/tiktok-login-callback?error=profile_update_failed',
          ...corsHeaders
        }
      })
    }

    console.log('✅ Profile updated successfully');

    // Clean up the OAuth state
    console.log('🧹 Cleaning up OAuth state');
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_value', state)

    console.log('🎉 TikTok connection completed successfully for user:', stateData.user_id);

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://thinkpost.co/tiktok-login-callback?tiktok=connected',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in TikTok callback:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://thinkpost.co/tiktok-login-callback?error=internal_error',
        ...corsHeaders
      }
    })
  }
})
