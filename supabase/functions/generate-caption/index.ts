
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
    const { imageId } = await req.json()

    if (!imageId) {
      throw new Error('Image ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the image details and user's restaurant info
    const { data: image, error: imageError } = await supabaseClient
      .from('images')
      .select(`
        *,
        user_profiles:user_id (
          restaurants (
            name,
            category,
            vision,
            location
          )
        )
      `)
      .eq('id', imageId)
      .single()

    if (imageError) {
      throw new Error(`Failed to fetch image: ${imageError.message}`)
    }

    const restaurant = image.user_profiles?.restaurants?.[0]
    
    // Get image URL
    const { data: urlData } = supabaseClient.storage
      .from('restaurant-images')
      .getPublicUrl(image.file_path)

    // Prepare context for AI
    const restaurantContext = restaurant ? `
    Restaurant: ${restaurant.name}
    Category: ${restaurant.category.replace('_', ' ')}
    Location: ${restaurant.location}
    Vision: ${restaurant.vision || 'No specific vision provided'}
    ` : 'No restaurant context available'

    // Generate caption using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert specializing in restaurant marketing. Generate engaging, authentic captions for food images that will perform well on social media platforms like TikTok and Instagram. 

            Consider the restaurant context and create captions that:
            - Are engaging and encourage interaction
            - Use relevant food and restaurant hashtags
            - Match the restaurant's style and location
            - Are authentic and not overly promotional
            - Include a call-to-action when appropriate
            - Support both English and Arabic if the location suggests it
            
            Keep captions concise but impactful (under 150 characters for the main text).`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate a social media caption for this food image. Restaurant context: ${restaurantContext}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: urlData.publicUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const caption = openaiData.choices[0]?.message?.content

    if (!caption) {
      throw new Error('No caption generated')
    }

    // Update the image with the generated caption
    const { error: updateError } = await supabaseClient
      .from('images')
      .update({ caption })
      .eq('id', imageId)

    if (updateError) {
      throw new Error(`Failed to update image caption: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        caption,
        message: 'Caption generated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating caption:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate caption',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
