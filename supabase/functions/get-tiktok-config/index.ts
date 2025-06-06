
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

    // Get TikTok client key from environment
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    
    console.log('TikTok Client Key configured:', !!clientKey)
    console.log('TikTok Client Key length:', clientKey?.length || 0)
    console.log('TikTok Client Key type:', typeof clientKey)
    
    if (!clientKey) {
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

    // Validate client key format
    const trimmedClientKey = clientKey.trim()
    if (trimmedClientKey.length === 0) {
      console.error('TikTok Client ID is empty after trimming')
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID is empty',
          details: 'Please check TIKTOK_CLIENT_ID configuration'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if client key contains any problematic characters
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(trimmedClientKey)
    console.log('Client key has special characters:', hasSpecialChars)
    
    if (hasSpecialChars) {
      console.warn('Client key contains special characters, this might cause issues')
    }

    // Get the origin from the request headers and construct the redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://thinkpost.co'
    
    // Use the correct TikTok callback page as redirect URI
    const redirectUri = `${origin}/tiktok-callback`

    console.log('Returning TikTok config to user:', user.id)
    console.log('Client Key (sanitized):', trimmedClientKey.substring(0, 8) + '...')
    console.log('Client Key length:', trimmedClientKey.length)
    console.log('Using redirect URI:', redirectUri)
    console.log('Request origin:', origin)
    
    return new Response(
      JSON.stringify({ 
        clientKey: trimmedClientKey,
        redirectUri
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
