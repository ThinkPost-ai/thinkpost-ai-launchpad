
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { code, state } = await req.json()
    
    if (!code) {
      throw new Error('Missing authorization code')
    }

    console.log('Processing Instagram OAuth callback with code:', code)

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '1092698762721463',
        client_secret: Deno.env.get('INSTAGRAM_APP_SECRET') ?? '',
        grant_type: 'authorization_code',
        redirect_uri: 'https://thinkpost.co/instagram-callback',
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful for user:', tokenData.user_id)

    // Get long-lived access token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${Deno.env.get('INSTAGRAM_APP_SECRET')}&access_token=${tokenData.access_token}`
    )

    let finalToken = tokenData.access_token
    if (longLivedTokenResponse.ok) {
      const longLivedTokenData = await longLivedTokenResponse.json()
      finalToken = longLivedTokenData.access_token
      console.log('Long-lived token obtained')
    }

    // Get user profile information
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalToken}`
    )

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Instagram profile')
    }

    const profileData = await profileResponse.json()
    console.log('Profile data fetched:', profileData.username)

    // Get the authenticated user from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Failed to get authenticated user')
    }

    // Update user profile with Instagram data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        instagram_connected: true,
        instagram_user_id: profileData.id,
        instagram_username: profileData.username,
        instagram_access_token: finalToken,
        instagram_avatar_url: `https://graph.instagram.com/${profileData.id}/picture?access_token=${finalToken}`,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update user profile')
    }

    console.log('Instagram connection successful for user:', user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        username: profileData.username,
        user_id: profileData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
