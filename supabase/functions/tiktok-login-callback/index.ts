
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
    console.log('TikTok login callback received')
    
    // Initialize Supabase client
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

    // Parse request body to get code and state
    const body = await req.json()
    const { code, state } = body

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return new Response(
        JSON.stringify({ error: 'Missing authorization parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify state token and get user ID
    const { data: stateData, error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .select('user_id, expires_at')
      .eq('state_token', state)
      .eq('user_id', user.id)
      .single()

    if (stateError || !stateData) {
      console.error('Invalid state token:', stateError)
      return new Response(
        JSON.stringify({ error: 'Invalid state token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if state token has expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State token expired')
      return new Response(
        JSON.stringify({ error: 'State token expired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Exchange code for access token - using exact values you specified
    const clientKey = "sbawdyn4l42rz2ceyq"
    const clientSecret = "YlXChnvcXTZ2N8kOMtFG2ZlDbPBH8ps3"
    const redirectUri = "https://thinkpost.co/tiktok-login-callback"

    console.log('Exchanging code for access token...')
    console.log('Using client_key:', clientKey)
    console.log('Using redirect_uri:', redirectUri)
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', tokenResponse.status, {
      ...tokenData,
      access_token: tokenData.access_token ? '[REDACTED]' : undefined,
      refresh_token: tokenData.refresh_token ? '[REDACTED]' : undefined
    })
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return new Response(
        JSON.stringify({ 
          error: 'Token exchange failed',
          details: tokenData.error_description || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user info from TikTok
    console.log('Fetching user info from TikTok...')
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User info response:', userResponse.status, {
      ...userData,
      data: userData.data ? {
        ...userData.data,
        user: userData.data.user ? {
          ...userData.data.user,
          open_id: userData.data.user.open_id ? '[REDACTED]' : undefined
        } : undefined
      } : undefined
    })
    
    if (!userResponse.ok || !userData.data?.user) {
      console.error('Failed to get user info:', userData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get TikTok user info',
          details: userData.error?.message || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const tiktokUser = userData.data.user

    // Store token in database
    console.log('Storing TikTok token in database...')
    
    const { error: insertError } = await supabase
      .from('tiktok_tokens')
      .upsert({
        user_id: user.id,
        open_id: tiktokUser.open_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }, { 
        onConflict: 'user_id,open_id'
      })

    if (insertError) {
      console.error('Failed to store token:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store TikTok token',
          details: insertError.message 
        }),
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

    console.log('TikTok login successful for user:', user.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          tiktok_user_id: tiktokUser.open_id,
          tiktok_username: tiktokUser.display_name || tiktokUser.username || 'Unknown',
          granted_scopes: tokenData.scope
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
    
  } catch (error) {
    console.error('TikTok login callback error:', error)
    
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
