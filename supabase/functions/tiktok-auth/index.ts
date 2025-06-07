
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID()
    
    // Store state in database
    const { error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .insert({
        state_value: state,
        user_id: user.id
      })

    if (stateError) {
      console.error('Error storing OAuth state:', stateError)
      return new Response(
        JSON.stringify({ error: 'Failed to initialize OAuth' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build TikTok OAuth URL
    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    tiktokAuthUrl.searchParams.set('client_key', Deno.env.get('TIKTOK_CLIENT_ID') || 'sbawdyn4l42rz2ceyq')
    tiktokAuthUrl.searchParams.set('response_type', 'code')
    tiktokAuthUrl.searchParams.set('scope', 'user.info.basic')
    tiktokAuthUrl.searchParams.set('redirect_uri', Deno.env.get('TIKTOK_REDIRECT_URI') || 'https://thinkpost.co/api/auth/tiktok/callback')
    tiktokAuthUrl.searchParams.set('state', state)

    return new Response(
      JSON.stringify({ authUrl: tiktokAuthUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in TikTok auth:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
