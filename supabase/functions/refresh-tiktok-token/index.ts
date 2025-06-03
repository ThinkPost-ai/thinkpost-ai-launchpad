
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('TikTok token refresh function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Get current TikTok connection
    const { data: connection, error: connectionError } = await supabase
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'TikTok connection not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token needs refresh (expires within 1 hour)
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (expiresAt > oneHourFromNow) {
      console.log('Token is still valid, no refresh needed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token is still valid',
          expires_at: connection.token_expires_at
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Refreshing TikTok access token...');

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured');
      return new Response(
        JSON.stringify({ error: 'TikTok configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Refresh the token
    const refreshResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    const refreshData = await refreshResponse.json();
    console.log('Token refresh response:', refreshResponse.status, {
      ...refreshData,
      access_token: refreshData.access_token ? '[REDACTED]' : undefined,
      refresh_token: refreshData.refresh_token ? '[REDACTED]' : undefined
    });

    if (!refreshResponse.ok || !refreshData.access_token) {
      console.error('Token refresh failed:', refreshData);
      
      // If refresh fails, user needs to reconnect
      await supabase
        .from('tiktok_connections')
        .delete()
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          error: 'Token refresh failed',
          details: 'Please reconnect your TikTok account',
          requires_reconnection: true
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the connection with new tokens
    const { error: updateError } = await supabase
      .from('tiktok_connections')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || connection.refresh_token,
        token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        scope: refreshData.scope || connection.scope
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update tokens',
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Token refresh successful');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Token refresh error:', error);
    
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
});
