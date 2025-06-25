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

    console.log('🔄 Processing Instagram OAuth callback with code:', code ? 'Present' : 'Missing')
    console.log('🔄 State parameter:', state ? 'Present' : 'Missing')

    // Get environment variables
    const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
    const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')

    console.log('🔍 Environment check:')
    console.log('- FACEBOOK_APP_ID:', facebookAppId ? 'Present' : 'Missing')
    console.log('- FACEBOOK_APP_SECRET:', facebookAppSecret ? 'Present' : 'Missing')

    if (!facebookAppId || !facebookAppSecret) {
      throw new Error('Missing Facebook app credentials in environment variables')
    }

    // Determine frontend URL for redirect - same logic as auth function
    let frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://thinkpost.co'

    // If not set and request comes from origin header, infer
    const originHeader = req.headers.get('origin') || req.headers.get('referer')
    if (!Deno.env.get('FRONTEND_URL') && originHeader) {
      try {
        const originUrl = new URL(originHeader)
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          frontendUrl = `${originUrl.protocol}//${originUrl.host}`
        }
      } catch (_) {
        console.log('Could not parse origin header:', originHeader)
      }
    }

    const redirectUri = `${frontendUrl}/instagram-callback`
    console.log('🔗 Using redirect URI:', redirectUri)

    // Instagram Business API uses Facebook Graph API for token exchange
    console.log('🔄 Exchanging authorization code for access token...')
    const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: facebookAppId,
        client_secret: facebookAppSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    console.log('📥 Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for token: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Token exchange successful, access_token length:', tokenData.access_token?.length)

    // For Instagram Business, we need to get the user's Instagram accounts
    // First, get the user's Facebook pages/accounts
    console.log('🔄 Fetching Instagram business accounts...')
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}&fields=instagram_business_account`
    )

    console.log('📥 Accounts response status:', accountsResponse.status)

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error('❌ Failed to fetch accounts:', errorText)
      throw new Error(`Failed to fetch Instagram business accounts: ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log('📊 Accounts data received:', accountsData.data?.length || 0, 'accounts')

    // Find the first Instagram business account
    let instagramAccount = null
    let pageWithInstagram = null
    for (const account of accountsData.data || []) {
      if (account.instagram_business_account) {
        instagramAccount = account.instagram_business_account
        pageWithInstagram = account
        break
      }
    }

    console.log('🔍 Instagram account found:', instagramAccount ? 'Yes' : 'No')

    if (!instagramAccount) {
      console.error('❌ No Instagram Business account found')
      throw new Error('No Instagram Business account found. Please make sure you have an Instagram Business account connected to your Facebook page.')
    }

    // Get Instagram account details
    console.log('🔄 Fetching Instagram profile details...')
    const profileResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccount.id}?fields=id,username,profile_picture_url,account_type&access_token=${tokenData.access_token}`
    )

    console.log('📥 Profile response status:', profileResponse.status)

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('❌ Failed to fetch profile:', errorText)
      throw new Error(`Failed to fetch Instagram profile: ${errorText}`)
    }

    const profileData = await profileResponse.json()
    console.log('✅ Profile data fetched - Username:', profileData.username, 'Account type:', profileData.account_type)

    // Get the authenticated user from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    console.log('🔄 Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      throw new Error('Failed to get authenticated user')
    }

    console.log('✅ User authenticated:', user.id)

    // Update user profile with Instagram data
    console.log('🔄 Updating user profile with Instagram data...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        instagram_connected: true,
        instagram_user_id: profileData.id,
        instagram_username: profileData.username,
        instagram_access_token: tokenData.access_token,
        instagram_avatar_url: profileData.profile_picture_url,
        facebook_page_id: pageWithInstagram?.id,
        facebook_access_token: pageWithInstagram?.access_token,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error(`Failed to update user profile: ${updateError.message}`)
    }

    console.log('🎉 Instagram connection successful for user:', user.id)
    console.log('📊 Connected Instagram account:', profileData.username, '(ID:', profileData.id, ')')

    return new Response(
      JSON.stringify({ 
        success: true, 
        username: profileData.username,
        user_id: profileData.id,
        account_type: profileData.account_type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Instagram OAuth callback error:', error)
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
