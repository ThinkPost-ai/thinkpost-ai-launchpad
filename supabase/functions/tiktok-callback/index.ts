
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

    // Parse URL parameters for GET request (TikTok callback)
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Callback parameters:', { code: !!code, state: !!state, error, errorDescription });

    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription);
      // Redirect to frontend with error
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=${encodeURIComponent(error)}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': frontendUrl,
        },
      });
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=missing_parameters`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': frontendUrl,
        },
      });
    }

    // For now, we need to find the user associated with this state
    // In a production app, you'd store the user_id with the state token
    console.log('Processing callback with code:', code, 'and state:', state);

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured')
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=server_config`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': frontendUrl,
        },
      });
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
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=token_exchange_failed`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': frontendUrl,
        },
      });
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
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=user_info_failed`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': frontendUrl,
        },
      });
    }

    const tiktokUser = userData.data.user
    
    // For now, redirect to frontend with success and let the frontend handle the storage
    // In a production app, you'd properly associate the state with a user_id
    const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_connected=true&username=${encodeURIComponent(tiktokUser.display_name)}&access_token=${encodeURIComponent(tokenData.access_token)}&tiktok_user_id=${encodeURIComponent(tiktokUser.open_id)}`;
    
    console.log('TikTok connection successful, redirecting to:', frontendUrl);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl,
      },
    });
    
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://thinkpost.co'}/user-dashboard?tiktok_error=server_error`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl,
      },
    });
  }
})
