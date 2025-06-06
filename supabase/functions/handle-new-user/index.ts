
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    
    console.log('New user record:', record)
    console.log('User metadata:', record.raw_user_meta_data)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: record.id,
        full_name: record.raw_user_meta_data?.full_name,
        avatar_url: record.raw_user_meta_data?.avatar_url,
        auth_provider: record.raw_user_meta_data?.auth_provider || 'email',
        tiktok_open_id: record.raw_user_meta_data?.tiktok_open_id
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    } else {
      console.log('Profile created successfully for user:', record.id)
    }

    // Create restaurant if restaurant data is provided
    const restaurantData = record.raw_user_meta_data
    console.log('Checking restaurant data:', {
      restaurant_name: restaurantData?.restaurant_name,
      restaurant_location: restaurantData?.restaurant_location,
      restaurant_category: restaurantData?.restaurant_category
    })

    if (restaurantData?.restaurant_name && restaurantData?.restaurant_location && restaurantData?.restaurant_category) {
      console.log('Creating restaurant with data:', {
        owner_id: record.id,
        name: restaurantData.restaurant_name,
        location: restaurantData.restaurant_location,
        category: restaurantData.restaurant_category,
        vision: restaurantData.restaurant_vision || null
      })

      const { data: restaurantResult, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: record.id,
          name: restaurantData.restaurant_name,
          location: restaurantData.restaurant_location,
          category: restaurantData.restaurant_category,
          vision: restaurantData.restaurant_vision || null
        })
        .select()

      if (restaurantError) {
        console.error('Error creating restaurant:', restaurantError)
      } else {
        console.log('Restaurant created successfully:', restaurantResult)
      }
    } else {
      console.log('No restaurant data provided or incomplete data')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in handle-new-user function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
