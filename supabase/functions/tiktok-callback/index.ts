
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
    console.log('TikTok callback function called');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let code, state, error, errorDescription;

    // Handle both GET (direct callback) and POST (from frontend) requests
    if (req.method === 'GET') {
      // Parse URL parameters for GET request (direct TikTok callback)
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      error = url.searchParams.get('error');
      errorDescription = url.searchParams.get('error_description');
    } else if (req.method === 'POST') {
      // Parse body for POST request (from frontend)
      try {
        const body = await req.json();
        code = body.code;
        state = body.state;
        error = body.error;
        errorDescription = body.error_description;
      } catch (e) {
        console.error('Error parsing POST body:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('Callback parameters:', { code: !!code, state: !!state, error, errorDescription });

    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription);
      return new Response(
        JSON.stringify({ 
          error: `TikTok OAuth error: ${error}`,
          description: errorDescription 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization parameters',
          details: 'Code and state parameters are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user from authorization header for POST requests
    if (req.method === 'POST') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('User verified:', user.id);
    }

    console.log('Processing callback with code:', code, 'and state:', state);

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = 'https://thinkpost.co/api/tiktok/callback'
    
    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured')
      return new Response(
        JSON.stringify({ error: 'TikTok configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('Exchanging code for access token...')
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', tokenResponse.status, tokenData)
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return new Response(
        JSON.stringify({ 
          error: 'Token exchange failed',
          details: tokenData.error_description || 'Failed to get access token'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user info from TikTok
    console.log('Fetching user info from TikTok...')
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User info response:', userResponse.status, userData)
    
    if (!userResponse.ok || !userData.data?.user) {
      console.error('Failed to get user info:', userData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get TikTok user info',
          details: userData.error?.message || 'Unknown error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tiktokUser = userData.data.user;
    
    console.log('TikTok connection successful');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          tiktok_user_id: tiktokUser.open_id,
          tiktok_username: tiktokUser.display_name,
          access_token: tokenData.access_token
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
