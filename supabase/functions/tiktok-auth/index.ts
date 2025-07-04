
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
    console.log('🚀 TikTok auth function started');
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('🔍 Environment check:');
    console.log('- SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing');
    console.log('- SUPABASE_ANON_KEY:', Deno.env.get('SUPABASE_ANON_KEY') ? 'Present' : 'Missing');
    console.log('- TIKTOK_CLIENT_ID:', Deno.env.get('TIKTOK_CLIENT_ID') ? 'Present' : 'Missing');

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    console.log('🔍 User authentication result:', { 
      userId: user?.id, 
      userEmail: user?.email, 
      error: userError?.message 
    });

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: userError?.message || 'No user found',
          debug: 'User authentication failed in tiktok-auth function'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id);

    // Get TikTok credentials from environment
    const client_key = Deno.env.get('TIKTOK_CLIENT_ID');
    if (!client_key) {
      console.error('❌ TIKTOK_CLIENT_ID not found in environment');
      console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'TikTok client configuration missing',
          details: 'TIKTOK_CLIENT_ID environment variable not set',
          debug: 'Missing TIKTOK_CLIENT_ID in environment'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ TikTok client ID found:', client_key);

    // Generate random state for CSRF protection
    const state = crypto.randomUUID()
    console.log('🔑 Generated OAuth state:', state);
    
    // Store state in database with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    console.log('📝 Storing OAuth state in database...');
    const { error: stateError } = await supabaseClient
      .from('tiktok_oauth_states')
      .insert({
        state_value: state,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      })

    if (stateError) {
      console.error('❌ Error storing OAuth state:', stateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize OAuth', 
          details: stateError.message,
          debug: 'Database error when storing OAuth state'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ OAuth state stored successfully');

    // Use the verified domain redirect URI that TikTok has approved
    const redirectUri = 'https://thinkpost.co/tiktok-callback'

    // Build TikTok OAuth URL
    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    tiktokAuthUrl.searchParams.set('client_key', client_key)
    tiktokAuthUrl.searchParams.set('response_type', 'code')
    tiktokAuthUrl.searchParams.set('scope', 'user.info.basic,video.publish')
    tiktokAuthUrl.searchParams.set('redirect_uri', redirectUri)
    tiktokAuthUrl.searchParams.set('state', state)

    console.log('🔗 TikTok Auth URL generated:', tiktokAuthUrl.toString())
    console.log('🔄 Redirect URI:', redirectUri)
    console.log('🎯 OAuth scope:', 'user.info.basic,video.publish')

    return new Response(
      JSON.stringify({ 
        authUrl: tiktokAuthUrl.toString(),
        debug: {
          clientId: client_key,
          redirectUri: redirectUri,
          state: state,
          userId: user.id
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in TikTok auth:', error)
    console.error('💥 Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        stack: error.stack,
        debug: 'Unhandled exception in tiktok-auth function'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
