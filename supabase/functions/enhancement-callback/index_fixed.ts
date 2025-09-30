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
  
  try {
    const requestBody = await req.json();
    const { 
      product_id: productId, 
      success, 
      generated_images: generatedImages, 
      error,
      // User data passed through from Vercel
      user_id: userId,
      product_name: productName,
      product_price: productPrice,
      product_description: productDescription,
      original_image_path: originalImagePath
    } = requestBody;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tinypngApiKey = Deno.env.get('TINYPNG_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !tinypngApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`📞 Enhancement callback received for product: ${productId}`);
    console.log(`📦 Callback data:`, { success, imageCount: generatedImages?.length, error });
    console.log(`👤 User data:`, { userId, productName, productPrice, productDescription });
    
    if (!success || error) {
      console.error(`❌ Enhancement failed for ${productId}:`, error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Enhancement processing failed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!generatedImages || generatedImages.length === 0) {
      throw new Error('No generated images received');
    }
    
    console.log(`✅ Processing ${generatedImages.length} enhanced images for ${productId}`);
    
    // Use the user data passed from the original request
    const originalProductData = {
      user_id: userId,
      name: productName || 'Enhanced Product',
      price: productPrice,
      description: productDescription,
      image_path: originalImagePath
    };
    
    console.log(`📋 Using product data from callback - User: ${originalProductData.user_id}, Product: ${originalProductData.name}`);
    
    if (!originalProductData.user_id) {
      console.error('⚠️ No user_id provided in callback data');
      throw new Error('No user_id provided for processing');
    }
    
    // Process each generated image and create product versions
    for (let i = 0; i < generatedImages.length; i++) {
      try {
        const generatedImage = generatedImages[i];
        console.log(`📸 Processing enhanced version ${i + 1}/${generatedImages.length}`);
        
        // Extract base64 from data URL
        const base64Data = generatedImage.image.split(',')[1];
        
        // Compress the enhanced image with TinyPNG
        console.log(`🖼️ Starting TinyPNG compression for image ${i + 1}...`);
        const compressedImageBase64 = await compressImageWithTinyPNG(base64Data, tinypngApiKey);
        
        // Convert compressed base64 to buffer for storage
        const processedImageBuffer = Uint8Array.from(atob(compressedImageBase64), (c) => c.charCodeAt(0));
        console.log(`📦 Final compressed image ${i + 1} size: ${Math.round(processedImageBuffer.length / 1024)}KB`);
        
        const enhancedFileName = `enhanced-multiple-${productId}-${Date.now()}-${i + 1}.jpg`;
        console.log(`💾 Uploading enhanced image ${i + 1} as: ${enhancedFileName}`);
        
        const { error: uploadError } = await supabase.storage
          .from("restaurant-images")
          .upload(enhancedFileName, processedImageBuffer, {
            contentType: "image/jpeg",
            upsert: false
          });
        
        if (uploadError) {
          console.error(`Upload failed for image ${i + 1}:`, uploadError);
          continue; // Skip this image but continue with others
        }
        
        const enhancedImageUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${enhancedFileName}`;
        console.log(`✅ Enhanced image ${i + 1} uploaded successfully: ${enhancedImageUrl}`);
        
        // Generate caption for this version using CORRECT product data
        console.log(`📝 Generating caption for version ${i + 1}...`);
        const { data: captionData, error: captionError } = await supabase.functions.invoke('generate-caption', {
          body: {
            productName: originalProductData.name, // Use ACTUAL product name
            price: originalProductData.price, // Use ACTUAL product price
            description: originalProductData.description || generatedImage.prompt, // Use actual description or enhancement prompt
            contentType: 'product',
            contentCategory: 'random'
          }
        });
        
        if (captionError) {
          console.error(`Caption generation failed for version ${i + 1}:`, captionError);
          console.error(`Caption error details:`, captionError);
        } else {
          console.log(`✅ Caption generated for version ${i + 1}:`, captionData?.caption?.substring(0, 100) + '...');
        }
        
        // Create new product record with enhanced image and generated caption
        const newProductData = {
          user_id: originalProductData.user_id,
          name: `${originalProductData.name} - Version ${i + 1}`,
          price: originalProductData.price,
          description: originalProductData.description || generatedImage.prompt,
          image_path: enhancedFileName,
          enhanced_image_path: enhancedFileName,
          image_enhancement_status: 'completed',
          caption: captionData?.caption || `Enhanced version ${i + 1} of ${originalProductData.name}`, // Use generated caption or fallback
          is_new: true,
          // Default TikTok settings
          tiktok_enabled: false,
          tiktok_privacy_level: 'public',
          tiktok_allow_comments: true,
          tiktok_commercial_content: false,
          tiktok_your_brand: false,
          tiktok_branded_content: false
        };
        
        console.log(`💾 Creating product version ${i + 1} with data:`, {
          name: newProductData.name,
          user_id: newProductData.user_id,
          enhanced_image_path: newProductData.enhanced_image_path,
          caption: newProductData.caption?.substring(0, 50) + '...'
        });
        
        const { data: createdProduct, error: createError } = await supabase
          .from('products')
          .insert(newProductData)
          .select()
          .single();
          
        if (createError) {
          console.error(`Failed to create product ${i + 1}:`, createError);
        } else {
          console.log(`✅ Created product version ${i + 1}: ${createdProduct.name} (ID: ${createdProduct.id})`);
          console.log(`📝 Caption saved: ${createdProduct.caption ? 'YES' : 'NO'}`);
        }
        
      } catch (error) {
        console.error(`Error processing version ${i + 1}:`, error);
      }
    }
    
    console.log(`🎉 Enhancement callback processing completed for ${productId}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Enhancement callback processed successfully',
      productId: productId
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    
  } catch (error) {
    console.error("Enhancement callback failed:", error);
    
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
