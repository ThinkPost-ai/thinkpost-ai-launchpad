
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
    console.log('TikTok callback function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('User verified:', user.id)

    // Get request body
    const { code, state } = await req.json()
    
    if (!code || !state) {
      console.error('Missing code or state parameter')
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Processing callback with code:', code, 'and state:', state)

    // Verify state token
    const { data: stateData, error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .select('*')
      .eq('state_token', state)
      .eq('user_id', user.id)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    if (stateError || !stateData) {
      console.error('Invalid or expired state token:', stateError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired state token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = `${req.headers.get('origin')}/api/tiktok/callback`
    
    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured')
      return new Response(
        JSON.stringify({ error: 'TikTok credentials not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log('Exchanging code for access token...')
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', tokenResponse.status, tokenData)
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code for access token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user info from TikTok
    console.log('Fetching user info from TikTok...')
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User info response:', userResponse.status, userData)
    
    if (!userResponse.ok || !userData.data?.user) {
      console.error('Failed to get user info:', userData)
      return new Response(
        JSON.stringify({ error: 'Failed to get user information from TikTok' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const tiktokUser = userData.data.user
    
    // Calculate token expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      : null

    // Store TikTok connection in database
    const { data: connectionData, error: connectionError } = await supabase
      .from('tiktok_connections')
      .upsert({
        user_id: user.id,
        tiktok_user_id: tiktokUser.open_id,
        tiktok_username: tiktokUser.display_name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        scope: tokenData.scope,
      }, { onConflict: 'user_id' })
      .select()

    if (connectionError) {
      console.error('Failed to store TikTok connection:', connectionError)
      return new Response(
        JSON.stringify({ error: 'Failed to store TikTok connection' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Clean up state token
    await supabase
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    console.log('TikTok connection successful for user:', user.id)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        tiktok_username: tiktokUser.display_name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
    
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
