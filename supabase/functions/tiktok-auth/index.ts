
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
    const action = url.searchParams.get('action')
    
    if (action === 'connect') {
      // Step 1: Redirect to TikTok OAuth
      const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-auth?action=callback`
      
      const scope = 'user.info.basic'
      const state = crypto.randomUUID() // Generate random state for security
      
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
        `?client_key=${clientId}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`

      console.log('Redirecting to TikTok OAuth:', authUrl)
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': authUrl,
        },
      })
    }
    
    if (action === 'callback') {
      // Step 2: Handle OAuth callback
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (!code) {
        throw new Error('No authorization code received')
      }

      console.log('Received OAuth callback with code:', code)
      
      // Exchange code for access token
      const clientId = Deno.env.get('TIKTOK_CLIENT_ID')
      const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-auth?action=callback`
      
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
        throw new Error('Failed to get access token from TikTok')
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
        throw new Error('Failed to get user data from TikTok')
      }

      const tiktokUser = userData.data.user
      
      // Get user from JWT token (if available)
      const authHeader = req.headers.get('Authorization')
      let userId = null
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id
      }
      
      // For now, we'll redirect to the dashboard with the TikTok data
      // In a real implementation, you'd want to store this in your database
      const dashboardUrl = `${url.origin}/user-dashboard?tiktok_connected=true&username=${tiktokUser.display_name}`
      
      if (userId) {
        // Store TikTok connection in database
        const { error } = await supabase
          .from('tiktok_connections')
          .upsert({
            user_id: userId,
            tiktok_user_id: tiktokUser.open_id,
            tiktok_username: tiktokUser.display_name,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            scope: tokenData.scope,
          })
          
        if (error) {
          console.error('Error storing TikTok connection:', error)
        }
      }
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': dashboardUrl,
        },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('TikTok auth error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
