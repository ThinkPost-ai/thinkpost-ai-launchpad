
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

    // The redirect URI should match what's configured in your TikTok app
    const redirectUri = 'https://thinkpost.co/api/tiktok/callback'

    console.log('Returning TikTok config to user:', user.id)
    console.log('Client Key (first 10 chars):', clientKey.substring(0, 10) + '...')
    console.log('Using redirect URI:', redirectUri)
    
    return new Response(
      JSON.stringify({ 
        clientKey,
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
