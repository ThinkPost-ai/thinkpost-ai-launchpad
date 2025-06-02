
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
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('Authorization header is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user token and get user ID
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying user token...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      throw new Error('Invalid user token')
    }

    console.log('User verified:', user.id)

    const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    if (!clientId) {
      console.error('TikTok Client ID not configured')
      throw new Error('TikTok Client ID not configured')
    }
    
    const scope = 'user.info.basic'
    const state = crypto.randomUUID() // Generate random state for security
    
    console.log('Generated state token:', state)
    console.log('Attempting to store state token for user:', user.id)
    
    // Store the state token temporarily for validation (expires in 10 minutes)
    const { data: insertData, error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .insert({
        state_token: state,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      })
      .select()

    if (stateError) {
      console.error('Failed to store state token:', stateError)
      console.error('Error details:', JSON.stringify(stateError, null, 2))
      throw new Error(`Failed to initialize OAuth flow: ${stateError.message}`)
    }

    console.log('State token stored successfully:', insertData)
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
      `?client_key=${clientId}` +
      `&scope=${scope}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`

    console.log('Redirecting to TikTok OAuth with state:', state)
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': authUrl,
      },
    })
  } catch (error) {
    console.error('TikTok auth error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
