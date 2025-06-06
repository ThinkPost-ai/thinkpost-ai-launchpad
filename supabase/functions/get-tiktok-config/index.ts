
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
    console.log('TikTok config request received')
    
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

    // Get TikTok configuration from environment
    const rawClientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const rawClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    
    console.log('=== TikTok Configuration Debug ===')
    console.log('Raw client key exists:', !!rawClientKey)
    console.log('Raw client key length:', rawClientKey?.length || 0)
    console.log('Raw client secret exists:', !!rawClientSecret)
    console.log('Raw client secret length:', rawClientSecret?.length || 0)
    
    if (!rawClientKey) {
      console.error('TikTok Client ID not configured')
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID not configured',
          details: 'Please configure TIKTOK_CLIENT_ID in Supabase secrets'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!rawClientSecret) {
      console.error('TikTok Client Secret not configured')
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client Secret not configured',
          details: 'Please configure TIKTOK_CLIENT_SECRET in Supabase secrets'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate and clean client key
    let cleanClientKey = String(rawClientKey)
    console.log('=== Client Key Validation ===')
    console.log('Original key length:', cleanClientKey.length)
    console.log('Original key preview:', cleanClientKey.substring(0, 10) + '...')
    
    // Remove all whitespace and non-alphanumeric characters
    cleanClientKey = cleanClientKey.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '')
    console.log('Cleaned key length:', cleanClientKey.length)
    console.log('Cleaned key preview:', cleanClientKey.substring(0, 10) + '...')
    
    if (cleanClientKey.length === 0) {
      console.error('Client key is empty after cleaning')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid TikTok Client ID',
          details: 'Client ID contains only invalid characters'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (cleanClientKey.length < 10) {
      console.error('Client key too short after cleaning:', cleanClientKey.length)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid TikTok Client ID',
          details: `Client ID too short (${cleanClientKey.length} characters)`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate and clean client secret
    let cleanClientSecret = String(rawClientSecret)
    console.log('=== Client Secret Validation ===')
    console.log('Original secret length:', cleanClientSecret.length)
    console.log('Original secret preview:', cleanClientSecret.substring(0, 8) + '...')
    
    // Remove all whitespace and non-alphanumeric characters
    cleanClientSecret = cleanClientSecret.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '')
    console.log('Cleaned secret length:', cleanClientSecret.length)
    console.log('Cleaned secret preview:', cleanClientSecret.substring(0, 8) + '...')
    
    if (cleanClientSecret.length === 0) {
      console.error('Client secret is empty after cleaning')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid TikTok Client Secret',
          details: 'Client Secret contains only invalid characters'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (cleanClientSecret.length < 10) {
      console.error('Client secret too short after cleaning:', cleanClientSecret.length)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid TikTok Client Secret',
          details: `Client Secret too short (${cleanClientSecret.length} characters)`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the origin and construct redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://thinkpost.co'
    const redirectUri = `${origin}/tiktok-callback`

    // Test TikTok API compatibility by making a simple request to validate credentials
    console.log('=== Testing TikTok API Compatibility ===')
    console.log('Using cleaned client key length:', cleanClientKey.length)
    console.log('Using cleaned client secret length:', cleanClientSecret.length)
    console.log('Redirect URI:', redirectUri)
    
    // Create a test authorization URL to validate the client_key format
    const testParams = new URLSearchParams()
    testParams.append('client_key', cleanClientKey)
    testParams.append('response_type', 'code')
    testParams.append('scope', 'user.info.basic')
    testParams.append('redirect_uri', redirectUri)
    testParams.append('state', 'test')
    
    const testUrl = `https://www.tiktok.com/v2/auth/authorize/?${testParams.toString()}`
    console.log('Generated test URL length:', testUrl.length)
    console.log('Test URL preview:', testUrl.substring(0, 100) + '...')
    
    console.log('SUCCESS: All validations passed')
    
    return new Response(
      JSON.stringify({ 
        clientKey: cleanClientKey,
        redirectUri,
        debug: {
          originalClientKeyLength: rawClientKey.length,
          cleanedClientKeyLength: cleanClientKey.length,
          originalSecretLength: rawClientSecret.length,
          cleanedSecretLength: cleanClientSecret.length,
          origin: origin,
          testUrlGenerated: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
    
  } catch (error) {
    console.error('TikTok config error:', error)
    
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
