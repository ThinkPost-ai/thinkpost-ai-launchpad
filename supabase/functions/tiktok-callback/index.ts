
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
    
    // Handle OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent(error)}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter')
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
      throw new Error('Invalid or expired state token')
    }

    // Check if state token is expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State token expired')
      throw new Error('State token has expired')
    }

    // Clean up the used state token
    await supabase
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    console.log('State validated, exchanging code for tokens for user:', stateData.user_id)
    
    // Exchange code for access token
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', tokenData)
    
    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token from TikTok: ${JSON.stringify(tokenData)}`)
    }

    // Get user info from TikTok
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User data from TikTok:', userData)
    
    if (!userData.data?.user) {
      throw new Error(`Failed to get user data from TikTok: ${JSON.stringify(userData)}`)
    }

    const tiktokUser = userData.data.user
    
    // Calculate token expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      : null

    // Store the TikTok connection with real tokens
    const { error: connectionError } = await supabase
      .from('tiktok_connections')
      .upsert({
        user_id: stateData.user_id,
        tiktok_user_id: tiktokUser.open_id,
        tiktok_username: tiktokUser.display_name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        scope: tokenData.scope || 'user.info.basic',
        token_expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (connectionError) {
      console.error('Failed to store TikTok connection:', connectionError)
      throw new Error('Failed to save TikTok connection')
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
