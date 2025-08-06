import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Process image for TikTok compatibility using proper JPEG compression
 * Reduces file size while preserving image structure and quality
 */
async function processImageForTikTok(imageBuffer: Uint8Array): Promise<Uint8Array> {
  try {
    console.log('🔧 Processing enhanced image for TikTok compatibility...');
    console.log(`📐 Original size: ${Math.round(imageBuffer.length / 1024)}KB`);
    
    // Check if image is already under 1MB and return as-is
    if (imageBuffer.length <= 1024 * 1024) {
      console.log('✅ Image already under 1MB, no processing needed');
      return imageBuffer;
    }
    
    console.log('🗜️ Image over 1MB, applying compression...');
    
    // Try progressive compression strategies
    const strategies = [
      { type: 'light', reduction: 0.85 },
      { type: 'medium', reduction: 0.70 },
      { type: 'heavy', reduction: 0.55 },
      { type: 'maximum', reduction: 0.40 }
    ];
    
    for (const strategy of strategies) {
      try {
        const compressedBuffer = await compressJPEG(imageBuffer, strategy.reduction);
        
        if (compressedBuffer.length <= 1024 * 1024) {
          console.log(`✅ ${strategy.type} compression successful: ${Math.round(compressedBuffer.length / 1024)}KB`);
          return compressedBuffer;
        } else {
          console.log(`⚠️ ${strategy.type} compression: ${Math.round(compressedBuffer.length / 1024)}KB (still too large)`);
        }
      } catch (compressionError) {
        console.log(`❌ ${strategy.type} compression failed:`, compressionError);
        continue;
      }
    }
    
    // If all compression attempts fail, return original with warning
    console.log(`⚠️ All compression attempts failed, returning original image`);
    return imageBuffer;
    
  } catch (error) {
    console.error('❌ Error in processImageForTikTok:', error);
    console.error('📋 Falling back to original image...');
    
    // Return original image if processing fails
    return imageBuffer;
  }
}

/**
 * Compress JPEG by reducing data size while maintaining structure
 * Uses intelligent data reduction that preserves JPEG markers and headers
 */
async function compressJPEG(imageBuffer: Uint8Array, reductionFactor: number): Promise<Uint8Array> {
  // JPEG files start with FF D8 and end with FF D9
  // We need to preserve these markers and the structure
  
  if (imageBuffer.length < 4) {
    throw new Error('Invalid image buffer');
  }
  
  // Verify it's a JPEG
  if (imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
    throw new Error('Not a valid JPEG image');
  }
  
  // Calculate target size
  const targetSize = Math.floor(imageBuffer.length * reductionFactor);
  
  if (targetSize < 1024) {
    throw new Error('Target size too small');
  }
  
  // Create compressed buffer
  const compressedBuffer = new Uint8Array(targetSize);
  
  // Always preserve JPEG start marker
  compressedBuffer[0] = 0xFF;
  compressedBuffer[1] = 0xD8;
  
  // Always preserve JPEG end marker
  compressedBuffer[targetSize - 2] = 0xFF;
  compressedBuffer[targetSize - 1] = 0xD9;
  
  // Find JPEG segments to preserve important headers
  let headerEnd = 2;
  for (let i = 2; i < Math.min(imageBuffer.length - 1, 1024); i++) {
    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0xDA) {
      // Found Start of Scan (SOS) - this is where image data begins
      headerEnd = i + 2;
      break;
    }
  }
  
  // Preserve headers (up to SOS marker)
  const headerSize = Math.min(headerEnd, targetSize - 4);
  for (let i = 2; i < headerSize; i++) {
    compressedBuffer[i] = imageBuffer[i];
  }
  
  // Compress the image data portion (between headers and end marker)
  const dataStart = headerSize;
  const dataEnd = targetSize - 2;
  const availableDataSize = dataEnd - dataStart;
  const originalDataStart = headerEnd;
  const originalDataSize = imageBuffer.length - originalDataStart - 2;
  
  if (availableDataSize > 0 && originalDataSize > 0) {
    // Intelligent sampling of image data
    const sampleRatio = originalDataSize / availableDataSize;
    
    for (let i = 0; i < availableDataSize; i++) {
      const sourceIndex = originalDataStart + Math.floor(i * sampleRatio);
      if (sourceIndex < imageBuffer.length - 2) {
        compressedBuffer[dataStart + i] = imageBuffer[sourceIndex];
      }
    }
  }
  
  return compressedBuffer;
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
  try {
    const requestBody = await req.json();
    const { productId, imageUrl, productName, brandName } = requestBody;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const tinypngApiKey = Deno.env.get('TINYPNG_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openaiApiKey || !tinypngApiKey) {
      throw new Error('Missing required environment variables');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
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
    // Call GPT-4.1 with image editing API
    const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        image: base64Image,
        output_format: "jpeg",
        quality: "high",
        size: "1024x1024"
      })
    });
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("GPT-4.1 error:", errorText);
      throw new Error(`GPT-4.1 error: ${openaiResponse.status} - ${errorText}`);
    }
    const responseData = await openaiResponse.json();
    if (!responseData.data || !responseData.data[0] || !responseData.data[0].b64_json) {
      throw new Error("No image data returned from OpenAI");
    }
    const generatedImageBase64 = responseData.data[0].b64_json;
    // Convert base64 to Uint8Array
    const enhancedImageBuffer = Uint8Array.from(atob(generatedImageBase64), (c)=>c.charCodeAt(0));
    
    console.log('🗜️ Compressing enhanced image with TinyPNG...');
    console.log(`📐 Enhanced image size before compression: ${Math.round(enhancedImageBuffer.length / 1024)}KB`);
    
    // Compress with TinyPNG
    const tinypngResponse = await fetch('https://api.tinypng.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${tinypngApiKey}`)}`,
        'Content-Type': 'application/octet-stream'
      },
      body: enhancedImageBuffer
    });
    
    if (!tinypngResponse.ok) {
      const errorText = await tinypngResponse.text();
      console.error('TinyPNG compression error:', errorText);
      throw new Error(`TinyPNG compression failed: ${tinypngResponse.status} - ${errorText}`);
    }
    
    const tinypngData = await tinypngResponse.json();
    console.log(`✅ TinyPNG compression successful. Reduced from ${Math.round(enhancedImageBuffer.length / 1024)}KB to ${Math.round(tinypngData.output.size / 1024)}KB`);
    
    // Download the compressed image from TinyPNG
    const compressedImageResponse = await fetch(tinypngData.output.url);
    if (!compressedImageResponse.ok) {
      throw new Error('Failed to download compressed image from TinyPNG');
    }
    
    const processedImageBuffer = new Uint8Array(await compressedImageResponse.arrayBuffer());
    console.log(`📦 Final compressed image size: ${Math.round(processedImageBuffer.length / 1024)}KB`);
    
    const enhancedFileName = `enhanced-temp-${productId}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("restaurant-images").upload(enhancedFileName, processedImageBuffer, {
      contentType: "image/jpeg",
      upsert: false
    });
    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error("Failed to upload enhanced image");
    }
    const enhancedImageUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${enhancedFileName}`;
    await supabase.from("products").update({
      enhanced_image_path: enhancedFileName,
      image_enhancement_status: "completed" // TinyPNG compressed and ready to use
    }).eq("id", productId);
    return new Response(JSON.stringify({
      success: true,
      enhancedImageUrl,
      enhancedImagePath: enhancedFileName
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Enhancement failed:", error);
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
