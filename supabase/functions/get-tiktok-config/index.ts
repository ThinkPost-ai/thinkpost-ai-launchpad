
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
    
    console.log('=== TikTok Client Key Debug ===')
    console.log('Raw client key exists:', !!rawClientKey)
    console.log('Raw client key length:', rawClientKey?.length || 0)
    console.log('Raw client key type:', typeof rawClientKey)
    
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

    // Enhanced client key sanitization with detailed logging
    let cleanClientKey = String(rawClientKey)
    console.log('Step 1 - Original key length:', cleanClientKey.length)
    console.log('Step 1 - Original key preview:', cleanClientKey.substring(0, 10) + '...')
    console.log('Step 1 - Has whitespace:', /\s/.test(cleanClientKey))
    console.log('Step 1 - Has non-alphanumeric:', /[^a-zA-Z0-9]/.test(cleanClientKey))
    
    // Remove all whitespace characters
    cleanClientKey = cleanClientKey.replace(/\s/g, '')
    console.log('Step 2 - After whitespace removal length:', cleanClientKey.length)
    
    // Log each character for debugging
    console.log('Step 3 - Character analysis:')
    for (let i = 0; i < Math.min(cleanClientKey.length, 20); i++) {
      const char = cleanClientKey[i]
      const code = char.charCodeAt(0)
      console.log(`  Char ${i}: "${char}" (code: ${code}) ${/[a-zA-Z0-9]/.test(char) ? 'VALID' : 'INVALID'}`)
    }
    
    // Check for any remaining problematic characters
    const problematicChars = cleanClientKey.match(/[^a-zA-Z0-9]/g)
    if (problematicChars && problematicChars.length > 0) {
      console.error('CRITICAL: Client key contains invalid characters:', problematicChars)
      console.error('Invalid character codes:', problematicChars.map(c => c.charCodeAt(0)))
      
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Client ID contains invalid characters',
          details: `Client ID must contain only letters and numbers. Found invalid characters: ${problematicChars.join(', ')} (codes: ${problematicChars.map(c => c.charCodeAt(0)).join(', ')})`,
          debug: {
            originalLength: rawClientKey.length,
            cleanedLength: cleanClientKey.length,
            invalidChars: problematicChars,
            invalidCodes: problematicChars.map(c => c.charCodeAt(0))
          }
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
          details: 'Client key is empty after removing invalid characters'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate minimum length
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

    // Get the origin and construct redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://thinkpost.co'
    const redirectUri = `${origin}/tiktok-callback`

    // Log final configuration
    console.log('=== Final TikTok Config ===')
    console.log('Clean client key length:', cleanClientKey.length)
    console.log('Clean client key preview:', cleanClientKey.substring(0, 8) + '...')
    console.log('Redirect URI:', redirectUri)
    console.log('Request origin:', origin)
    
    // Additional validation: ensure the client key matches expected TikTok format
    // TikTok client keys are typically alphanumeric and around 18-24 characters
    if (cleanClientKey.length < 15 || cleanClientKey.length > 30) {
      console.warn('WARNING: Client key length is unusual for TikTok:', cleanClientKey.length)
    }
    
    // Final character validation
    if (!/^[a-zA-Z0-9]+$/.test(cleanClientKey)) {
      console.error('FINAL VALIDATION FAILED: Client key still contains non-alphanumeric characters')
      return new Response(
        JSON.stringify({ 
          error: 'Client key validation failed',
          details: 'Client key contains characters that are not letters or numbers'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log('SUCCESS: Client key passed all validations')
    
    return new Response(
      JSON.stringify({ 
        clientKey: cleanClientKey,
        redirectUri,
        debug: {
          originalLength: rawClientKey.length,
          cleanedLength: cleanClientKey.length,
          origin: origin
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
