
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
    console.log('TikTok auth callback function called');
    console.log('Request method:', req.method);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let code, state, mode;

    // Handle both GET (direct callback) and POST (from frontend) requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      mode = 'auth'; // Default to auth mode for direct callbacks
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        code = body.code;
        state = body.state;
        mode = body.mode || 'auth';
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

    console.log('Auth callback parameters:', { code: !!code, state: !!state, mode });

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
        'Cache-Control': 'no-cache',
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
    console.log('Token exchange response:', tokenResponse.status, {
      ...tokenData,
      access_token: tokenData.access_token ? '[REDACTED]' : undefined,
      refresh_token: tokenData.refresh_token ? '[REDACTED]' : undefined
    })
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Token exchange failed',
          details: tokenData.error_description || 'Failed to get access token',
          tiktok_error: tokenData.error
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user info from TikTok
    console.log('Fetching user info from TikTok...')
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User info response:', userResponse.status, {
      ...userData,
      data: userData.data ? {
        ...userData.data,
        user: userData.data.user ? {
          ...userData.data.user,
          open_id: userData.data.user.open_id ? '[REDACTED]' : undefined
        } : undefined
      } : undefined
    })
    
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
    
    // Store or update TikTok user data
    const { data: existingTikTokUser, error: findError } = await supabase
      .from('tiktok_users')
      .select('*')
      .eq('tiktok_open_id', tiktokUser.open_id)
      .maybeSingle();

    if (findError) {
      console.error('Error finding TikTok user:', findError);
    }

    const tikTokUserData = {
      tiktok_open_id: tiktokUser.open_id,
      display_name: tiktokUser.display_name,
      username: tiktokUser.username,
      avatar_url: tiktokUser.avatar_url,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scope: tokenData.scope
    };

    if (existingTikTokUser) {
      // Update existing TikTok user
      const { error: updateError } = await supabase
        .from('tiktok_users')
        .update(tikTokUserData)
        .eq('tiktok_open_id', tiktokUser.open_id);

      if (updateError) {
        console.error('Failed to update TikTok user:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update TikTok user data',
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Create new TikTok user
      const { error: insertError } = await supabase
        .from('tiktok_users')
        .insert(tikTokUserData);

      if (insertError) {
        console.error('Failed to create TikTok user:', insertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create TikTok user',
            details: insertError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if we have a Supabase user linked to this TikTok account
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('tiktok_open_id', tiktokUser.open_id)
      .maybeSingle();

    let supabaseUser;

    if (existingProfile) {
      // User exists, get their auth data
      const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(existingProfile.id);
      
      if (getUserError) {
        console.error('Error getting existing user:', getUserError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to authenticate existing user',
            details: getUserError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      supabaseUser = user;
    } else {
      // Create new Supabase user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: `${tiktokUser.open_id}@tiktok.thinkpost.co`, // Fake email for TikTok users
        email_confirm: true,
        user_metadata: {
          auth_provider: 'tiktok',
          tiktok_open_id: tiktokUser.open_id,
          display_name: tiktokUser.display_name,
          full_name: tiktokUser.display_name,
          avatar_url: tiktokUser.avatar_url
        }
      });

      if (createUserError) {
        console.error('Failed to create Supabase user:', createUserError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user account',
            details: createUserError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      supabaseUser = newUser.user;
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: supabaseUser.email!,
    });

    if (sessionError) {
      console.error('Failed to generate session:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create session',
          details: sessionError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('TikTok authentication successful');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: supabaseUser.id,
          tiktok_user_id: tiktokUser.open_id,
          display_name: tiktokUser.display_name,
          avatar_url: tiktokUser.avatar_url
        },
        session: sessionData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('TikTok auth callback error:', error)
    
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
