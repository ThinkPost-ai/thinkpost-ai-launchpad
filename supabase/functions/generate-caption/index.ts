
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
    const { imageId, mealName } = await req.json()

    if (!imageId) {
      throw new Error('Image ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the image details
    const { data: image, error: imageError } = await supabaseClient
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (imageError) {
      throw new Error(`Failed to fetch image: ${imageError.message}`)
    }

    // Get the user's restaurant info
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('owner_id', image.user_id)
      .single()

    if (restaurantError) {
      console.log('No restaurant found, using default info')
    }
    
    // Get image URL
    const { data: urlData } = supabaseClient.storage
      .from('restaurant-images')
      .getPublicUrl(image.file_path)

    // Prepare Arabic prompt
    const restaurantInfo = restaurant || {
      name: 'مطعم الذوق الرفيع',
      location: 'الرياض',
      category: 'مطعم عام',
      vision: 'تقديم أفضل الأطباق'
    }

    const prompt = `معطى هذه الصورة: ${urlData.publicUrl}
وهذه المعلومات
اسم المطعم: ${restaurantInfo.name}
موقعه: ${restaurantInfo.location}
تصنيف المطعم: ${restaurantInfo.category}
رؤية المطعم: ${restaurantInfo.vision || 'تقديم أفضل الأطباق'}
اسم الوجبة: ${mealName || 'وجبة مميزة'}

أكتب محتوى ابداعي للصورة لنشره على برامج التواصل الاجتماعي`

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
            content: `أنت خبير تسويق وتقدر تكتب محتوى أبداعي وتسويقي عن الصور المعطاه لك للتسويق عنها في السوشل ميديا للمطاعم. بتكتب المحتوى بالاستعانة بعدة أمور:
1-أسم المطعم.
2-موقعه: عشان تشوف وش الثقافة السائدة وتكون كتابتك مناسبة للجمهور وتلامسهم.
3-تنصيف المطعم: أكل شعبي, اكلات سريعة, معجنات, مقاهي , حلويات, مخبوزات..الخ.
4-رؤية المطعم: تساعدك رؤية المطعم على صنع أسلوب تسويقي خاص في المطعم ويركز على أهدافه ورؤيته وقيمته التنافسية.
5-أسم الوجبة: استخدم اسم الوجبة في المحتوى التسويقي.

اجعل لهجهتك في الكتابة اقرب للعامية السعودية وابتعد عن اللهجة العربية الفصحى.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
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
