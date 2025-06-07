
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

    if (!code || !state) {
      return new Response('Missing code or state parameter', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

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
      return new Response('Invalid or expired state parameter', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: Deno.env.get('TIKTOK_CLIENT_ID') || 'sbawdyn4l42rz2ceyq',
        client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET') || 'YlXChnvcXTZ2N8kOMtFGZ2IDbPBH8ps3',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: Deno.env.get('TIKTOK_REDIRECT_URI') || 'https://thinkpost.co/api/auth/tiktok/callback'
      })
    })

    if (!tokenResponse.ok) {
      console.error('TikTok token exchange failed:', await tokenResponse.text())
      return new Response('Failed to exchange code for token', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, open_id } = tokenData

    if (!access_token || !open_id) {
      return new Response('Invalid token response from TikTok', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Fetch user info from TikTok
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    let username = null
    let avatarUrl = null

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      username = userInfo.data?.user?.display_name
      avatarUrl = userInfo.data?.user?.avatar_url
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
      return new Response('Failed to update profile', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Clean up the OAuth state
    await supabaseClient
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_value', state)

    // Redirect to dashboard with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/user-dashboard?tab=overview&tiktok=connected',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Error in TikTok callback:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })
  }
})
