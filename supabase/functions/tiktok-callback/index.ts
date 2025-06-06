
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify state and get user
    const { data: stateData, error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .select('user_id')
      .eq('state_token', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = stateData.user_id

    // Exchange code for access token
    const tiktokClientId = Deno.env.get('TIKTOK_CLIENT_ID')
    const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI')

    if (!tiktokClientId || !tiktokClientSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: 'TikTok credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: tiktokClientId,
        client_secret: tiktokClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error('TikTok token exchange error:', tokenData)
      return new Response(JSON.stringify({ error: 'Failed to exchange code for token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user info from TikTok
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()

    if (!userInfoResponse.ok || userInfo.error) {
      console.error('TikTok user info error:', userInfo)
      return new Response(JSON.stringify({ error: 'Failed to get user info' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update user profile with TikTok data
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        tiktok_open_id: userInfo.data.user.open_id,
        tiktok_username: userInfo.data.user.display_name,
        tiktok_avatar_url: userInfo.data.user.avatar_url,
        tiktok_connected: true,
        tiktok_token: tokenData.access_token,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Clean up state
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    // Redirect to dashboard with success
    const dashboardUrl = new URL(redirectUri)
    dashboardUrl.pathname = '/user-dashboard'
    dashboardUrl.searchParams.set('tab', 'overview')
    dashboardUrl.searchParams.set('tiktok', 'connected')

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl.toString(),
      },
    })
  } catch (error) {
    console.error('Error in tiktok-callback:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
