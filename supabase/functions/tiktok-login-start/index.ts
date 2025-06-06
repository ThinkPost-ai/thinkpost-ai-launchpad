
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
    console.log('TikTok login start request received')
    
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

    // TikTok OAuth configuration - using exact values specified
    const clientKey = "sbawdyn4l42rz2ceyq"
    const redirectUri = "https://thinkpost.co/tiktok-login-callback"
    const scope = "user.info.basic,user.info.profile,user.info.stats,video.upload,video.publish"
    const responseType = "code"
    
    // Generate state token for CSRF protection
    const state = crypto.randomUUID()
    
    console.log('TikTok OAuth Configuration:')
    console.log('- client_key:', clientKey)
    console.log('- redirect_uri:', redirectUri)
    console.log('- scope:', scope)
    console.log('- response_type:', responseType)
    console.log('- state:', state)
    
    // Store the state token temporarily for validation (expires in 10 minutes)
    const { error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .insert({
        state_token: state,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })

    if (stateError) {
      console.error('Failed to store state token:', stateError)
      return new Response(
        JSON.stringify({ error: 'Failed to initialize OAuth flow' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build TikTok OAuth URL using the EXACT format specified in TikTok Login Kit docs
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    console.log('Generated TikTok OAuth URL:')
    console.log('Full URL:', authUrl)
    console.log('URL Components:')
    console.log('- Base URL: https://www.tiktok.com/v2/auth/authorize')
    console.log('- client_key:', clientKey)
    console.log('- scope (encoded):', encodeURIComponent(scope))
    console.log('- response_type:', responseType)
    console.log('- redirect_uri (encoded):', encodeURIComponent(redirectUri))
    console.log('- state:', state)
    
    return new Response(
      JSON.stringify({ 
        auth_url: authUrl,
        state: state,
        client_key: clientKey,
        redirect_uri: redirectUri
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
    
  } catch (error) {
    console.error('TikTok login start error:', error)
    
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
