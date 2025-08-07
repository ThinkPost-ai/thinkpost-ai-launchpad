import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Resize image to TikTok optimal dimensions (1080x1920) while maintaining aspect ratio
 * Takes base64 image data and returns resized base64 data with 24-bit depth for TikTok compatibility
 */
async function resizeImageForTikTok(base64Data: string): Promise<string> {
  try {
    console.log('📐 Resizing image for TikTok optimal dimensions (1080x1920) with 24-bit depth...');
    
    // TikTok optimal dimensions
    const targetWidth = 1080;
    const targetHeight = 1920;
    
    // Convert base64 to image data
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([imageBytes], { type: 'image/jpeg' });
    
    // Create image bitmap for processing
    const imageBitmap = await createImageBitmap(blob);
    const { width: originalWidth, height: originalHeight } = imageBitmap;
    
    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    let newWidth = targetWidth;
    let newHeight = targetHeight;
    
    if (aspectRatio > targetWidth / targetHeight) {
      // Image is wider, fit to width
      newHeight = targetWidth / aspectRatio;
    } else {
      // Image is taller, fit to height
      newWidth = targetHeight * aspectRatio;
    }
    
    // Create canvas with TikTok dimensions
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d', { 
      colorSpace: 'srgb',
      willReadFrequently: false 
    });
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Fill background with white for 24-bit RGB compatibility
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Center the image
    const x = (targetWidth - newWidth) / 2;
    const y = (targetHeight - newHeight) / 2;
    
    // Draw resized image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, x, y, newWidth, newHeight);
    
    // Convert to blob with 24-bit JPEG (ensures 24-bit depth)
    const resizedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.95  // High quality for TikTok
    });
    
    // Convert blob back to base64
    const arrayBuffer = await resizedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 1024;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8Array.slice(i, i + chunkSize));
    }
    const resizedBase64 = btoa(binary);
    
    console.log(`📏 Image resized from ${originalWidth}x${originalHeight} to ${Math.round(newWidth)}x${Math.round(newHeight)} (centered in ${targetWidth}x${targetHeight})`);
    console.log('✅ TikTok resize completed with 24-bit depth');
    
    imageBitmap.close(); // Clean up
    return resizedBase64;
    
  } catch (error) {
    console.error('TikTok resize error:', error);
    console.warn('⚠️ Returning original image due to resize failure');
    return base64Data;
  }
}

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
serve(async (req)=>{
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
    // Construct the enhancement prompt
    const prompt = `
    Enhance this image for marketing purposes.

    CRITICAL PRODUCT INTEGRITY RULES:
    - This image contains a ${productName || 'product'} that **must remain completely unaltered**.
    - **Do NOT modify, edit, move, retouch, or recreate any part of the product**, including:
      - Logos
      - Text (especially any Arabic text)
      - Labels
      - Colors
      - Shapes
      - Branding elements
    - **No part of the product should be changed in any way.**

    Notes (only outside the product):
    - Enhance lighting for a soft golden-hour glow that flatters the scene, **without affecting the product's original color**.
    - Subtly sharpen only the product edges for clarity, **without adding artificial effects**.
    - Gently blur the background to create depth, but **do not alter background content or introduce new elements**.
    - Remove visual distractions only if **they do not touch or overlap with the product**.
    - Adjust color balance and contrast for overall richness, but keep tones **natural and true to the original scene**.
    - Add subtle creative lighting or atmosphere ONLY if they **do not cover, touch, or obscure any part of the product**.

    Final result must look clean, professional, and premium — suitable for high-end food/café social media marketing.

    ${brandName ? `BRAND INFORMATION: ${brandName}` : ''}
    `;

    // Call GPT-4.1 with tool-based image generation
    console.log('🤖 Sending image to GPT-4.1 for enhancement...');
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${base64Image}`
              }
            ]
          }
        ],
        tools: [
          {
            type: "image_generation"
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("GPT-4.1 error:", errorText);
      throw new Error(`GPT-4.1 error: ${openaiResponse.status} - ${errorText}`);
    }

    const responseData = await openaiResponse.json();
    const imageCall = responseData.output?.find((o) => o.type === "image_generation_call");
    if (!imageCall || !imageCall.result) {
      throw new Error("No image data returned from GPT-4.1");
    }
    const generatedImageBase64 = imageCall.result;
    
    console.log('✅ GPT-4.1 image enhancement completed successfully');
    
    // Resize the enhanced image for TikTok optimal dimensions
    console.log('📐 Resizing enhanced image for TikTok...');
    const resizedImageBase64 = await resizeImageForTikTok(generatedImageBase64);
    
    // Compress the resized image with TinyPNG
    console.log('🖼️ Starting TinyPNG compression...');
    const compressedImageBase64 = await compressImageWithTinyPNG(resizedImageBase64, tinypngApiKey);
    
    // Convert compressed base64 to buffer for storage
    const processedImageBuffer = Uint8Array.from(atob(compressedImageBase64), (c) => c.charCodeAt(0));
    console.log(`📦 Final compressed image size: ${Math.round(processedImageBuffer.length / 1024)}KB`);
    
    const enhancedFileName = `enhanced-temp-${productId}-${Date.now()}.jpg`;
    console.log(`💾 Uploading enhanced image as: ${enhancedFileName}`);
    
    const { error: uploadError } = await supabase.storage.from("restaurant-images").upload(enhancedFileName, processedImageBuffer, {
      contentType: "image/jpeg",
      upsert: false
    });
    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error("Failed to upload enhanced image");
    }
    
    const enhancedImageUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${enhancedFileName}`;
    console.log(`✅ Enhanced image uploaded successfully: ${enhancedImageUrl}`);
    
    // Update product with enhanced image information
    const { error: updateError } = await supabase.from("products").update({
      enhanced_image_path: enhancedFileName,
      image_enhancement_status: "completed" // TinyPNG compressed and ready to use
    }).eq("id", productId);
    
    if (updateError) {
      console.error("Failed to update product:", updateError);
      // Don't throw error, as image was successfully processed
    }
    
    console.log(`🎉 Image enhancement completed successfully for product ${productId}`);
    
    return new Response(JSON.stringify({
      success: true,
      enhancedImageUrl,
      enhancedImagePath: enhancedFileName,
      compressionApplied: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Enhancement failed:", error);
    
    // Try to update product status to failed
    try {
      await supabase.from("products").update({
        image_enhancement_status: "failed"
      }).eq("id", productId);
    } catch (updateError) {
      console.error("Failed to update product status to failed:", updateError);
    }
    
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
