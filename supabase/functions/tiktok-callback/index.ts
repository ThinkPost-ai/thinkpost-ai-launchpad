
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

    console.log('TikTok callback received:', { code: code?.slice(0, 10) + '...', state })

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify state and get user (CSRF protection)
    const { data: stateData, error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .select('user_id')
      .eq('state_token', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateData) {
      console.error('Invalid or expired state:', stateError)
      return new Response(JSON.stringify({ error: 'Invalid or expired state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = stateData.user_id
    console.log('State validated for user:', userId)

    // Exchange code for access token using your exact credentials
    const tiktokClientId = 'sbawdyn4l42rz2ceyq'
    const tiktokClientSecret = 'YlXChnvcXTZ2N8kOMtFGZ2IDbPBH8ps3'
    const redirectUri = 'https://thinkpost.co/api/auth/tiktok/callback'

    console.log('Exchanging code for token...')

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
    console.log('Token response status:', tokenResponse.status)
    console.log('Token response:', { ...tokenData, access_token: tokenData.access_token?.slice(0, 10) + '...' })

    if (!tokenResponse.ok || tokenData.error) {
      console.error('TikTok token exchange error:', tokenData)
      return new Response(JSON.stringify({ error: 'Failed to exchange code for token', details: tokenData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user info from TikTok
    console.log('Fetching TikTok user info...')
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()
    console.log('User info response status:', userInfoResponse.status)
    console.log('User info:', userInfo)

    if (!userInfoResponse.ok || userInfo.error) {
      console.error('TikTok user info error:', userInfo)
      return new Response(JSON.stringify({ error: 'Failed to get user info', details: userInfo }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update user profile with TikTok data
    console.log('Updating user profile with TikTok data...')
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
      return new Response(JSON.stringify({ error: 'Failed to update profile', details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Profile updated successfully')

    // Clean up state
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    // Redirect to dashboard with success
    const dashboardUrl = new URL('https://thinkpost.co')
    dashboardUrl.pathname = '/user-dashboard'
    dashboardUrl.searchParams.set('tab', 'overview')
    dashboardUrl.searchParams.set('tiktok', 'connected')

    console.log('Redirecting to:', dashboardUrl.toString())

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl.toString(),
      },
    })
  } catch (error) {
    console.error('Error in tiktok-callback:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
