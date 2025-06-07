
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    console.log('TikTok callback received:', { code: !!code, state: !!state })

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=missing_parameters',
          ...corsHeaders
        }
      })
    }

    // Use service role key for all database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate state (CSRF protection)
    const { data: stateData, error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .select('user_id')
      .eq('state_value', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateData) {
      console.error('Invalid or expired state parameter:', stateError)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=invalid_state',
          ...corsHeaders
        }
      })
    }

    // Use the correct redirect URI for token exchange
    const redirectUri = 'https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-callback'

    console.log('Exchanging code for token with redirect URI:', redirectUri)

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: Deno.env.get('TIKTOK_CLIENT_ID') || '',
        client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET') || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('TikTok token exchange failed:', errorText)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=token_exchange_failed',
          ...corsHeaders
        }
      })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, open_id } = tokenData

    console.log('Token exchange successful:', { has_access_token: !!access_token, open_id })

    if (!access_token || !open_id) {
      console.error('Invalid token response from TikTok:', tokenData)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=invalid_token_response',
          ...corsHeaders
        }
      })
    }

    // Fetch user info from TikTok with proper authorization header
    let username = null
    let avatarUrl = null

    try {
      console.log('Fetching user info from TikTok with access token')
      const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('User info response status:', userInfoResponse.status)

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        console.log('User info response:', JSON.stringify(userInfo, null, 2))
        
        username = userInfo.data?.user?.display_name
        avatarUrl = userInfo.data?.user?.avatar_url
        console.log('User info extracted:', { username, has_avatar: !!avatarUrl })
      } else {
        const errorText = await userInfoResponse.text()
        console.error('Failed to fetch user info from TikTok:', {
          status: userInfoResponse.status,
          statusText: userInfoResponse.statusText,
          error: errorText
        })
      }
    } catch (userInfoError) {
      console.error('Error fetching user info:', userInfoError)
    }

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
      console.error('Error updating profile:', updateError)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=profile_update_failed',
          ...corsHeaders
        }
      })
    }

    // Clean up the OAuth state
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_value', state)

    console.log('TikTok connection successful for user:', stateData.user_id)

    // Redirect to dashboard with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?tiktok=connected',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Error in TikTok callback:', error)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://eztbwukcnddtvcairvpz.supabase.co/tiktok-login-callback?error=internal_error',
        ...corsHeaders
      }
    })
  }
})
