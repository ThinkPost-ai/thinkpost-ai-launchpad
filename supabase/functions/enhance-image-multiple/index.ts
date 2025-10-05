import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Compress image using TinyPNG API
 * Takes base64 image data and returns compressed base64 data
 */
async function compressImageWithTinyPNG(base64Data: string, apiKey: string): Promise<string> {
  try {
    console.log('🔧 Compressing image with TinyPNG...');
    
    // Convert base64 to binary for TinyPNG API
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Step 1: Upload image to TinyPNG for compression
    const response = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: imageBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TinyPNG compression failed:', errorText);
      throw new Error(`TinyPNG compression failed: ${response.status} - ${errorText}`);
    }

    // Get the location URL from the response headers
    const locationUrl = response.headers.get('Location');
    if (!locationUrl) {
      throw new Error('No location URL returned from TinyPNG');
    }

    console.log('📍 TinyPNG compression successful, downloading from:', locationUrl);

    // Step 2: Download the compressed image
    const compressedResponse = await fetch(locationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
    });

    if (!compressedResponse.ok) {
      throw new Error(`Failed to download compressed image from TinyPNG: ${compressedResponse.status}`);
    }
    
    const compressedBuffer = await compressedResponse.arrayBuffer();
    const compressedUint8Array = new Uint8Array(compressedBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 1024;
    for (let i = 0; i < compressedUint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(...compressedUint8Array.slice(i, i + chunkSize));
    }
    const compressedBase64 = btoa(binary);
    
    console.log(`✅ TinyPNG compression successful. Size reduced from ${Math.round(base64Data.length * 0.75 / 1024)}KB to ${Math.round(compressedBuffer.byteLength / 1024)}KB`);
    
    return compressedBase64;
  } catch (error) {
    console.error('TinyPNG compression error:', error);
    // Return original image if compression fails
    console.warn('⚠️ Returning original image due to TinyPNG compression failure');
    return base64Data;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  let productId, supabase, imageUrl, productName, brandName;
  
  try {
    const requestBody = await req.json();
    ({ productId, imageUrl, productName, brandName } = requestBody);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const tinypngApiKey = Deno.env.get('TINYPNG_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openaiApiKey || !tinypngApiKey) {
      throw new Error('Missing required environment variables');
    }
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from auth header to check/decrement credits
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const userId = user.id;

    // Check and decrement credits for 3 operations (since we're generating 3 images)
    console.log('Checking operation credits for user:', userId);
    const { data: creditsData, error: creditsError } = await supabase.rpc('decrement_operation_credits', {
      p_user_id: userId,
      operation_type: 'content_generation'
    });

    if (creditsError) {
      console.error('Error checking credits:', creditsError);
      throw new Error('Failed to check credits');
    }

    console.log('Credits remaining after decrement:', creditsData);

    if (creditsData < 0) {
      console.log('User has no remaining credits');
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. You have reached your monthly limit.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch original image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 1024;
    for(let i = 0; i < uint8Array.length; i += chunkSize){
      binary += String.fromCharCode(...uint8Array.slice(i, i + chunkSize));
    }
    const base64Image = btoa(binary);
    
    // Prepare image data for the new API
    const imageBase64 = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('🚀 Calling new image generator API for 3 images with callback...');
    
    // Create callback URL for async processing
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enhancement-callback`;
    
    console.log(`🚀 Starting async enhancement request with callback: ${callbackUrl}`);
    
    // Get additional product info from the request for callback
    const callbackUserId = requestBody.userId || requestBody.user_id || userId; // Use existing userId as fallback
    const callbackProductName = requestBody.productName || requestBody.product_name || productName;
    const productPrice = requestBody.productPrice || requestBody.price;
    const productDescription = requestBody.productDescription || requestBody.description;
    const originalImagePath = requestBody.originalImagePath || requestBody.image_path;
    const generateCaption = requestBody.generateCaption !== undefined ? requestBody.generateCaption : true; // Default to true for backward compatibility
    
    console.log(`🎯 Caption generation setting for product ${productId}: ${generateCaption}`);
    
    // Call the new Vercel API with callback (async processing)
    const enhancementResponse = await fetch('https://python-hello-world-git-main-yousefs-projects-4d997d7d.vercel.app/api/improve2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        number_of_images: 3,
        callback_url: callbackUrl,
        product_id: productId,
        // Pass user data for callback processing
        user_id: callbackUserId,
        product_name: callbackProductName || 'Enhanced Product',
        product_price: productPrice,
        product_description: productDescription,
        original_image_path: originalImagePath,
        generate_caption: generateCaption
      })
    });

    if (!enhancementResponse.ok) {
      const errorText = await enhancementResponse.text();
      console.error('Image generator API error:', errorText);
      
      // Handle specific quota exceeded error
      if (enhancementResponse.status === 429 || errorText.includes('quota') || errorText.includes('insufficient_quota')) {
        throw new Error('OpenAI quota exceeded. Please try again later or upgrade your plan.');
      }
      
      throw new Error(`Image generator API error: ${enhancementResponse.status} - ${errorText}`);
    }

    console.log('✅ Enhancement request sent to Vercel API - processing asynchronously');
    
    // Return immediately - Vercel will call back when done
    return new Response(JSON.stringify({
      success: true,
      message: 'Enhancement started - processing asynchronously',
      productId: productId,
      status: 'processing'
    }), {
      status: 202, // 202 Accepted - processing will continue asynchronously
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    
  } catch (error) {
    console.error("Multiple enhancement failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
