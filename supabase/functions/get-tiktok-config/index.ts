
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
    const rawClientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    
    console.log('Raw TikTok Client Key configured:', !!rawClientKey)
    console.log('Raw TikTok Client Key length:', rawClientKey?.length || 0)
    console.log('Raw TikTok Client Key type:', typeof rawClientKey)
    
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

    // Enhanced client key sanitization
    // 1. Convert to string and trim whitespace
    let cleanClientKey = String(rawClientKey).trim()
    
    // 2. Remove all whitespace characters (spaces, tabs, newlines)
    cleanClientKey = cleanClientKey.replace(/\s/g, '')
    
    // 3. Log detailed information about the key
    console.log('After trimming - Client Key length:', cleanClientKey.length)
    console.log('Client Key first 8 chars:', cleanClientKey.substring(0, 8))
    console.log('Client Key last 8 chars:', cleanClientKey.substring(-8))
    
    // Check for any remaining problematic characters
    const hasNonAlphanumeric = /[^a-zA-Z0-9]/.test(cleanClientKey)
    console.log('Client key has non-alphanumeric characters:', hasNonAlphanumeric)
    
    if (hasNonAlphanumeric) {
      console.warn('Client key contains non-alphanumeric characters, this will cause TikTok OAuth to fail')
      // Log the problematic characters for debugging
      const problematicChars = cleanClientKey.match(/[^a-zA-Z0-9]/g)
      console.log('Problematic characters found:', problematicChars)
      
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID contains invalid characters',
          details: 'Client ID must contain only letters and numbers. Found invalid characters: ' + (problematicChars?.join(', ') || 'unknown')
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate final client key
    if (cleanClientKey.length === 0) {
      console.error('TikTok Client ID is empty after sanitization')
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID is empty',
          details: 'Please check TIKTOK_CLIENT_ID configuration - key is empty after removing whitespace'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Final validation - ensure it looks like a valid TikTok client key
    if (cleanClientKey.length < 10) {
      console.error('TikTok Client ID appears too short:', cleanClientKey.length)
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID appears invalid',
          details: `Client ID length (${cleanClientKey.length}) is too short. Expected at least 10 characters.`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the origin from the request headers and construct the redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://thinkpost.co'
    
    // Use the correct TikTok callback page as redirect URI
    const redirectUri = `${origin}/tiktok-callback`

    console.log('Returning TikTok config to user:', user.id)
    console.log('Final sanitized Client Key (first 8 chars):', cleanClientKey.substring(0, 8) + '...')
    console.log('Final Client Key length:', cleanClientKey.length)
    console.log('Using redirect URI:', redirectUri)
    console.log('Request origin:', origin)
    
    return new Response(
      JSON.stringify({ 
        clientKey: cleanClientKey,
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
