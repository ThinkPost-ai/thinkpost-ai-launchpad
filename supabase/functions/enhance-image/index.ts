import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Function started, parsing request body...');
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    const { productId, imageUrl, productName, brandName } = requestBody;

    console.log('Starting image enhancement for product:', productId);
    console.log('Image URL:', imageUrl);
    console.log('Product name:', productName);
    console.log('Brand name:', brandName);

    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key from secrets
    console.log('Getting OpenAI API key...');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    console.log('OpenAI API key found, length:', openaiApiKey.length);

    // Download the original image
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download original image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`Downloaded image size: ${imageBuffer.byteLength} bytes`);
    
    // Convert to base64 more efficiently to avoid stack overflow with large images
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 1024; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    
    const base64Image = btoa(binary);

    // Create enhancement prompt
    const prompt = `
Enhance this image for marketing purposes. 

INSTRUCTIONS:
- Keep the composition focused on the ${productName || 'product'}, emphasizing luxury, calm, and modern café/restaurant vibes.
- Improve lighting to create a warm, golden-hour glow. Sharpen the product details to make them pop.
- Slightly blur the background to create depth of field and focus attention on the main product.
- Keep any text written on any product in the image, especially Arabic text.
- Be creative and add some elements to the image to make it more interesting.
- Adjust color balance for richness and clarity while keeping the natural tones.
- Remove any visual distractions and enhance overall image quality to make it look like a professional lifestyle or promotional photo.
- Do not change any details of any products in the image like text and brand name or logo.
- Do not change the logo of the brand if it is visible in the image.
- Preserve any Arabic text or branding elements exactly as they appear.

${brandName ? `BRAND INFORMATION: ${brandName}` : ''}

Make this image look professional and appetizing for social media marketing.
`;

    console.log('Using GPT-4o with DALL-E 3 function calling...');

    // Step 1: Use GPT-4o to analyze the image and generate DALL-E prompt
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this ${productName || 'product'} image and describe it in detail for DALL-E 3 enhancement. Focus on maintaining exact text, branding, and product details while improving lighting, composition, and marketing appeal. Brand: ${brandName || 'unknown'}.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        functions: [
          {
            name: "generate_enhanced_image",
            description: "Generate an enhanced marketing image using DALL-E 3",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "Detailed DALL-E 3 prompt for image enhancement"
                }
              },
              required: ["prompt"]
            }
          }
        ],
        function_call: { name: "generate_enhanced_image" },
        max_tokens: 1000
      })
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('GPT-4o Vision error:', errorText);
      throw new Error(`GPT-4o Vision error: ${visionResponse.status} - ${errorText}`);
    }

    const visionResult = await visionResponse.json();
    const functionCall = visionResult.choices[0].message.function_call;
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call returned from GPT-4o');
    }

    const { prompt: enhancementPrompt } = JSON.parse(functionCall.arguments);
    console.log('Generated enhancement prompt:', enhancementPrompt.substring(0, 200) + '...');

    // Step 2: Use DALL-E 3 to generate the enhanced image
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancementPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "b64_json"
      })
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      console.error('DALL-E 3 error:', errorText);
      throw new Error(`DALL-E 3 error: ${dalleResponse.status} - ${errorText}`);
    }

    const dalleResult = await dalleResponse.json();
    const enhancedImageBase64 = dalleResult.data[0].b64_json;

    console.log('Enhanced image generated, uploading to storage...');

    // Upload enhanced image to Supabase storage
    const enhancedImageBuffer = Uint8Array.from(atob(enhancedImageBase64), c => c.charCodeAt(0));
    const enhancedFileName = `enhanced-${productId}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(enhancedFileName, enhancedImageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload enhanced image');
    }

    const enhancedImageUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${enhancedFileName}`;

    // Update product with enhanced image path
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        enhanced_image_path: enhancedFileName,
        image_enhancement_status: 'completed'
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update product with enhanced image');
    }

    console.log('Image enhancement completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        enhancedImageUrl,
        enhancedImagePath: enhancedFileName
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Image enhancement error:', error);
    
    // If we have a productId, mark the enhancement as failed
    if (error.productId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('products')
          .update({ image_enhancement_status: 'failed' })
          .eq('id', error.productId);
      } catch (dbError) {
        console.error('Failed to update enhancement status:', dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Image enhancement failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 