
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
    console.log('TikTok login callback received')
    
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://thinkpost.co/user-dashboard?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
        }
      })
    }

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://thinkpost.co/user-dashboard?error=missing_parameters'
        }
      })
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify state token and get user ID
    const { data: stateData, error: stateError } = await supabase
      .from('tiktok_oauth_states')
      .select('user_id, expires_at')
      .eq('state_token', state)
      .single()

    if (stateError || !stateData) {
      console.error('Invalid state token:', stateError)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://thinkpost.co/user-dashboard?error=invalid_state'
        }
      })
    }

    // Check if state token has expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State token expired')
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://thinkpost.co/user-dashboard?error=state_expired'
        }
      })
    }

    // Exchange code for access token
    const clientKey = "sbawdyn4l42rz2ceyq"
    const clientSecret = "YlXChnvcXTZ2N8kOMtFG2ZlDbPBH8ps3"
    const redirectUri = "https://thinkpost.co/tiktok-callback"

    console.log('Exchanging code for access token...')
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://thinkpost.co/user-dashboard?error=token_exchange_failed&details=${encodeURIComponent(tokenData.error_description || 'Unknown error')}`
        }
      })
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
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://thinkpost.co/user-dashboard?error=user_info_failed&details=${encodeURIComponent(userData.error?.message || 'Unknown error')}`
        }
      })
    }

    const tiktokUser = userData.data.user

    // Store token in database
    console.log('Storing TikTok token in database...')
    
    const { error: insertError } = await supabase
      .from('tiktok_tokens')
      .upsert({
        user_id: stateData.user_id,
        open_id: tiktokUser.open_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }, { 
        onConflict: 'user_id,open_id'
      })

    if (insertError) {
      console.error('Failed to store token:', insertError)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://thinkpost.co/user-dashboard?error=storage_failed&details=${encodeURIComponent(insertError.message)}`
        }
      })
    }

    // Clean up state token
    await supabase
      .from('tiktok_oauth_states')
      .delete()
      .eq('state_token', state)

    console.log('TikTok login successful for user:', stateData.user_id)
    
    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://thinkpost.co/user-dashboard?tiktok_connected=true&username=${encodeURIComponent(tiktokUser.display_name || tiktokUser.username || 'Unknown')}`
      }
    })
    
  } catch (error) {
    console.error('TikTok login callback error:', error)
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://thinkpost.co/user-dashboard?error=internal_error&details=${encodeURIComponent(error.message)}`
      }
    })
  }
})
