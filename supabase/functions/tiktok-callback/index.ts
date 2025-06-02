
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
    console.log('TikTok callback received:', req.url)
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const scopes = url.searchParams.get('scopes')
    
    console.log('Callback params:', { 
      hasCode: !!code, 
      state, 
      error, 
      scopes 
    })
    
    // Handle OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error)
      const errorDescription = url.searchParams.get('error_description')
      // Redirect to your app's domain with error
      const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent(error + (errorDescription ? ': ' + errorDescription : ''))}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      })
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state })
      const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent('Missing authorization code or state parameter')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      })
    }

    // Get TikTok configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = 'https://thinkpost.co/api/tiktok/callback'
    
    console.log('TikTok config:', {
      hasClientKey: !!clientKey,
      hasClientSecret: !!clientSecret,
      redirectUri
    })
    
    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured')
      const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent('TikTok credentials not configured')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      })
    }
    
    console.log('Exchanging code for access token...')
    
    // Exchange code for access token using TikTok's token endpoint
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
    console.log('Token exchange response:', {
      status: tokenResponse.status,
      hasAccessToken: !!tokenData.access_token,
      tokenData: tokenData
    })
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent('Failed to exchange authorization code for access token')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      })
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
    console.log('User info response:', {
      status: userResponse.status,
      userData: userData
    })
    
    if (!userResponse.ok || !userData.data?.user) {
      console.error('Failed to get user info:', userData)
      const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent('Failed to get user information from TikTok')}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      })
    }

    const tiktokUser = userData.data.user
    
    // For now, we'll need to get the user ID from the state or another method
    // This is a simplified version - in production you'd need to validate the state
    // and get the actual user ID who initiated the OAuth flow
    
    // Calculate token expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      : null

    // For now, return a success response with user info
    // In production, you'd store this in the database linked to the authenticated user
    console.log('TikTok connection successful:', {
      tiktokUserId: tiktokUser.open_id,
      username: tiktokUser.display_name
    })
    
    // Redirect to success page
    const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_connected=true&username=${encodeURIComponent(tiktokUser.display_name)}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    })
    
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    const redirectUrl = `https://thinkpost.co/user-dashboard?tiktok_error=${encodeURIComponent(error.message)}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    })
  }
})
