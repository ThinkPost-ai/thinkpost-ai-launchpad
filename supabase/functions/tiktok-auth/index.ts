
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use anon key client to verify the user's session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tiktokClientId = Deno.env.get('TIKTOK_CLIENT_ID')
    if (!tiktokClientId) {
      return new Response(JSON.stringify({ error: 'TikTok client ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a secure state parameter
    const state = crypto.randomUUID()
    const redirectUri = `${req.url.split('/supabase/functions')[0]}/tiktok-login-callback`

    // Use service role client to insert state (bypasses RLS)
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Store state in database for validation
    const { error: stateError } = await serviceRoleClient
      .from('tiktok_oauth_states')
      .insert({
        user_id: user.id,
        state_token: state,
        expires_at: new Date(Date.now() + 600000).toISOString(), // 10 minutes
      })

    if (stateError) {
      console.error('Error storing state:', stateError)
      return new Response(JSON.stringify({ error: 'Failed to initiate OAuth' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    tiktokAuthUrl.searchParams.set('client_key', tiktokClientId)
    tiktokAuthUrl.searchParams.set('response_type', 'code')
    tiktokAuthUrl.searchParams.set('scope', 'user.info.basic')
    tiktokAuthUrl.searchParams.set('redirect_uri', redirectUri)
    tiktokAuthUrl.searchParams.set('state', state)

    return new Response(JSON.stringify({ authUrl: tiktokAuthUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in tiktok-auth:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
