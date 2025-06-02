
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    // Handle OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error)
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent(error)}`
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    if (!code) {
      throw new Error('No authorization code received')
    }

    console.log('Received OAuth callback with code:', code)
    
    // Exchange code for access token
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-callback`
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', tokenData)
    
    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token from TikTok: ${JSON.stringify(tokenData)}`)
    }

    // Get user info from TikTok
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('User data from TikTok:', userData)
    
    if (!userData.data?.user) {
      throw new Error(`Failed to get user data from TikTok: ${JSON.stringify(userData)}`)
    }

    const tiktokUser = userData.data.user
    
    // For now, redirect to dashboard with success message
    // The user will need to manually link their account or we'll implement a different linking strategy
    const dashboardUrl = `${url.origin}/user-dashboard?tiktok_connected=true&username=${tiktokUser.display_name}&tiktok_user_id=${tiktokUser.open_id}`
    
    console.log('Redirecting to dashboard with TikTok user data')
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl,
      },
    })
  } catch (error) {
    console.error('TikTok callback error:', error)
    
    const url = new URL(req.url)
    const dashboardUrl = `${url.origin}/user-dashboard?tiktok_error=${encodeURIComponent(error.message)}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': dashboardUrl,
      },
    })
  }
})
