
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
    console.log('TikTok auth request received')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)
    
    const url = new URL(req.url)
    console.log('URL search params:', url.searchParams.toString())
    
    // Get the authorization token from URL parameter (primary method for this flow)
    const tokenFromUrl = url.searchParams.get('token')
    console.log('Token from URL:', tokenFromUrl ? 'present' : 'missing')
    
    // Also check Authorization header as fallback
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    
    let token = null;
    if (tokenFromUrl) {
      token = tokenFromUrl
      console.log('Using token from URL parameter')
    } else if (authHeader) {
      token = authHeader.replace('Bearer ', '')
      console.log('Using token from Authorization header')
    }
    
    console.log('Final token exists:', !!token)
    
    if (!token) {
      console.error('No authorization token provided in URL parameter or header')
      return new Response(
        JSON.stringify({ 
          error: 'Authorization token is required',
          details: 'Token must be provided as ?token=<your_token> URL parameter'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL configured:', !!supabaseUrl)
    console.log('Service role key configured:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user token and get user ID
    console.log('Verifying user token...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    console.log('User verification result:', { 
      hasUser: !!user, 
      userId: user?.id,
      error: userError?.message 
    })
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid user token',
          details: userError?.message || 'Token verification failed'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('User verified successfully:', user.id)

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const redirectUri = `${supabaseUrl}/functions/v1/tiktok-callback`
    
    console.log('TikTok Client Key configured:', !!clientKey)
    console.log('Redirect URI:', redirectUri)
    
    if (!clientKey) {
      console.error('TikTok Client ID not configured')
      return new Response(
        JSON.stringify({ error: 'TikTok Client ID not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Create anti-forgery state token as recommended by TikTok docs
    const state = crypto.randomUUID()
    
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
      return new Response(
        JSON.stringify({ error: `Failed to initialize OAuth flow: ${stateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('State token stored successfully:', insertData)
    
    // Build the TikTok authorization URL following their exact specification
    const authUrl = 'https://www.tiktok.com/v2/auth/authorize/' +
      '?client_key=' + encodeURIComponent(clientKey) +
      '&scope=' + encodeURIComponent('user.info.basic') +
      '&response_type=code' +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&state=' + encodeURIComponent(state)

    console.log('Final TikTok auth URL:', authUrl)
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
    console.error('Error stack:', error.stack)
    
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
