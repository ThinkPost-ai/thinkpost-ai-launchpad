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

    // Instagram Business API uses Facebook Graph API for token exchange
    const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
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
    console.log('Token exchange successful, access_token length:', tokenData.access_token?.length)

    // For Instagram Business, we need to get the user's Instagram accounts
    // First, get the user's Facebook pages/accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}&fields=instagram_business_account`
    )

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch Instagram business accounts')
    }

    const accountsData = await accountsResponse.json()
    console.log('Accounts data:', JSON.stringify(accountsData, null, 2))

    // Find the first Instagram business account
    let instagramAccount = null
    for (const account of accountsData.data || []) {
      if (account.instagram_business_account) {
        instagramAccount = account.instagram_business_account
        break
      }
    }

    if (!instagramAccount) {
      throw new Error('No Instagram Business account found. Please make sure you have an Instagram Business account connected to your Facebook page.')
    }

    // Get Instagram account details
    const profileResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccount.id}?fields=id,username,profile_picture_url,account_type&access_token=${tokenData.access_token}`
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
        instagram_access_token: tokenData.access_token,
        instagram_avatar_url: profileData.profile_picture_url,
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
