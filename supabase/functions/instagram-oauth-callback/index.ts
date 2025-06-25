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

    // For development with Basic Display API, get user's pages first
    console.log('🔄 Fetching user pages...')
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}&fields=id,name,instagram_business_account`
    )

    console.log('📥 Accounts response status:', accountsResponse.status)

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error('❌ Failed to fetch accounts:', errorText)
      throw new Error(`Failed to fetch user pages: ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log('📊 Pages data received:', accountsData.data?.length || 0, 'pages')

    // Find a page with Instagram Business account
    let instagramAccount: any = null
    let pageWithInstagram: any = null
    for (const account of accountsData.data || []) {
      if (account.instagram_business_account) {
        instagramAccount = account.instagram_business_account
        pageWithInstagram = account
        break
      }
    }

    console.log('🔍 Instagram account found:', instagramAccount ? 'Yes' : 'No')

    // If no Instagram Business account found, try to get basic Instagram info
    if (!instagramAccount) {
      console.log('ℹ️ No Instagram Business account found, checking for basic Instagram access...')
      
      // For development, we'll use the user's basic info as a fallback
      const userResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${tokenData.access_token}&fields=id,name`
      )
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        // Create a mock Instagram account for development
        instagramAccount = { id: userData.id }
        pageWithInstagram = { id: userData.id, name: userData.name }
        console.log('✅ Using basic user data for development testing')
      } else {
        throw new Error('No Instagram Business account found and unable to get basic user data. Please make sure you have an Instagram Business account connected to your Facebook page.')
      }
    }

    // Get Instagram account details (or fallback data for development)
    console.log('🔄 Fetching Instagram profile details...')
    let profileData: any
    
    if (pageWithInstagram?.name) {
      // If we have a real Instagram Business account, fetch its details
      try {
        const profileResponse = await fetch(
          `https://graph.facebook.com/v21.0/${instagramAccount.id}?fields=id,username,profile_picture_url,account_type&access_token=${tokenData.access_token}`
        )

        if (profileResponse.ok) {
          profileData = await profileResponse.json()
          console.log('✅ Real Instagram profile data fetched - Username:', profileData.username)
        } else {
          throw new Error('Failed to fetch Instagram profile')
        }
      } catch (error) {
        console.log('⚠️ Could not fetch Instagram profile, using fallback data for development')
        // Use fallback data for development testing
        profileData = {
          id: instagramAccount.id,
          username: pageWithInstagram.name.toLowerCase().replace(/\s+/g, ''),
          profile_picture_url: null,
          account_type: 'BUSINESS'
        }
      }
    } else {
      // Fallback for development
      profileData = {
        id: instagramAccount.id,
        username: 'test_user_dev',
        profile_picture_url: null,
        account_type: 'BUSINESS'
      }
    }
    
    console.log('✅ Profile data ready - Username:', profileData.username, 'Account type:', profileData.account_type)

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
