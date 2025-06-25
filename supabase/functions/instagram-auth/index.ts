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
    console.log('🚀 Instagram auth function called')
    
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') 
    const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
    const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const envStatus = {
      supabaseUrl: supabaseUrl ? '✅ Present' : '❌ Missing',
      supabaseAnonKey: supabaseAnonKey ? '✅ Present' : '❌ Missing',
      facebookAppId: facebookAppId ? '✅ Present' : '❌ Missing',
      facebookAppSecret: facebookAppSecret ? '✅ Present' : '❌ Missing',
      serviceRoleKey: serviceRoleKey ? '✅ Present' : '❌ Missing'
    }

    console.log('🔍 Environment check:', envStatus)

    // If this is a test request (check for a test parameter), return env status
    const url = new URL(req.url)
    if (url.searchParams.get('test') === 'env') {
      return new Response(
        JSON.stringify({ 
          message: 'Environment variable status',
          environment: envStatus,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!facebookAppId) {
      console.error('❌ Missing FACEBOOK_APP_ID environment variable')
      return new Response(
        JSON.stringify({ 
          error: 'Instagram integration not configured. Missing FACEBOOK_APP_ID environment variable. Please contact support.',
          environment: envStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!facebookAppSecret) {
      console.error('❌ Missing FACEBOOK_APP_SECRET environment variable')
      return new Response(
        JSON.stringify({ 
          error: 'Instagram integration not configured. Missing FACEBOOK_APP_SECRET environment variable. Please contact support.',
          environment: envStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUserClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const supabaseServiceClient = createClient(
      supabaseUrl ?? '',
      serviceRoleKey ?? ''
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'User not authenticated. Please log in again.',
          environment: envStatus
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Generate random state for CSRF protection
    const state = crypto.randomUUID()
    
    // Try to store state in database
    try {
      console.log('💾 Storing OAuth state in database...')
      const { error: stateError } = await supabaseServiceClient
        .from('instagram_oauth_states')
        .insert({
          state_value: state,
          user_id: user.id,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        })

      if (stateError) {
        console.error('❌ Error storing OAuth state:', stateError)
        
        // Check if it's a table not found error
        if (stateError.message?.includes('does not exist') || stateError.code === '42P01') {
          return new Response(
            JSON.stringify({ 
              error: 'Database table missing. Please contact support to set up Instagram integration tables.',
              environment: envStatus,
              dbError: stateError
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to initialize OAuth flow. Please try again.',
            environment: envStatus,
            dbError: stateError
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('✅ OAuth state stored successfully')
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed. Please try again later.',
          environment: envStatus,
          dbError: dbError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine frontend URL for redirect
    let frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://thinkpost.co'

    // If not set and request comes from localhost, infer
    const originHeader = req.headers.get('origin') || req.headers.get('referer')
    if (!Deno.env.get('FRONTEND_URL') && originHeader) {
      try {
        const originUrl = new URL(originHeader)
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          frontendUrl = `${originUrl.protocol}//${originUrl.host}`
        }
      } catch (_) {}
    }

    const redirectUri = `${frontendUrl}/instagram-callback`

    // Build Facebook OAuth URL (which includes Instagram permissions)
    const facebookAuthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth')
    facebookAuthUrl.searchParams.set('client_id', facebookAppId)
    facebookAuthUrl.searchParams.set('redirect_uri', redirectUri)
    facebookAuthUrl.searchParams.set('state', state)
    facebookAuthUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish')
    facebookAuthUrl.searchParams.set('response_type', 'code')

    console.log('✅ Instagram/Facebook Auth URL generated successfully')
    console.log('🔗 Redirect URI:', redirectUri)

    return new Response(
      JSON.stringify({ authUrl: facebookAuthUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in Instagram auth:', error)
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message || 'Unknown error'}. Please try again later.`,
        errorDetails: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 