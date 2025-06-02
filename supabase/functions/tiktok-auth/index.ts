
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Initiate TikTok OAuth flow
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    const scope = 'user.info.basic'
    const state = crypto.randomUUID() // Generate random state for security
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
      `?client_key=${clientId}` +
      `&scope=${scope}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`

    console.log('Redirecting to TikTok OAuth:', authUrl)
    
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
