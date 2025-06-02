
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const scopes = url.searchParams.get('scopes')
    
    console.log('TikTok callback received:', { 
      code: !!code, 
      state, 
      error, 
      scopes,
      fullUrl: req.url 
    })
    
    // Handle OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error)
      const errorDescription = url.searchParams.get('error_description')
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent(error + (errorDescription ? ': ' + errorDescription : ''))}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state })
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('Missing authorization code or state parameter')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    console.log('Validating state token:', state)
    
    // Validate state token and get associated user
    const { data: stateData, error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .select('user_id, expires_at')
      .eq('state_token', state)
      .single()

    if (stateError || !stateData) {
      console.error('Invalid state token:', stateError)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('Invalid or expired state token')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    // Check if state token is expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State token expired')
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('State token has expired')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    // Clean up the used state token
    await supabase
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    console.log('State validated, exchanging code for tokens for user:', stateData.user_id)
    
    // Exchange code for access token using TikTok's token endpoint
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    console.log('Exchanging code for token with:', {
      clientKey: !!clientKey,
      clientSecret: !!clientSecret,
      redirectUri,
      code: code.substring(0, 10) + '...'
    })
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response status:', tokenResponse.status)
    console.log('Token exchange response:', tokenData)
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('Failed to exchange authorization code for access token')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    // Get user info from TikTok
    console.log('Fetching user info with access token')
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User info response status:', userResponse.status)
    console.log('User data from TikTok:', userData)
    
    if (!userResponse.ok || !userData.data?.user) {
      console.error('Failed to get user info:', userData)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('Failed to get user information from TikTok')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    const tiktokUser = userData.data.user
    
    // Calculate token expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      : null

    console.log('Storing TikTok connection for user:', stateData.user_id)
    
    // Store the TikTok connection
    const { error: connectionError } = await supabase
      .from('tiktok_connections')
      .upsert({
        user_id: stateData.user_id,
        tiktok_user_id: tiktokUser.open_id,
        tiktok_username: tiktokUser.display_name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        scope: tokenData.scope || scopes || 'user.info.basic',
        token_expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (connectionError) {
      console.error('Failed to store TikTok connection:', connectionError)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent('Failed to save TikTok connection')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }
    
    // Redirect to dashboard with success message
    const dashboardUrl = `${url.origin}/user-dashboard?tiktok_connected=true&username=${encodeURIComponent(tiktokUser.display_name)}`
    
    console.log('TikTok connection successful for user:', stateData.user_id)
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl,
      },
    })
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    const url = new URL(req.url)
    const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent(error.message)}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl,
      },
    })
  }
})
