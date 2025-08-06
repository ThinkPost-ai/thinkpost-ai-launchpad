import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Process image for TikTok compatibility in Deno environment
 * This replicates the exact client-side processing logic for enhanced images
 * - Loads image and calculates proper dimensions
 * - Resizes if dimensions exceed 1080x1920 while maintaining aspect ratio
 * - Removes metadata and ICC profiles through canvas processing
 * - Converts to JPEG format at 92% quality
 */
async function processImageForTikTok(imageBuffer: Uint8Array): Promise<Uint8Array> {
  try {
    console.log('🔧 Processing enhanced image for TikTok compatibility...');
    
    // Create a blob from the image buffer
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const imageUrl = URL.createObjectURL(blob);
    
    console.log(`📐 Original size: ${Math.round(imageBuffer.length / 1024)}KB`);
    
    // Create an Image object to get dimensions
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;
          
          console.log(`📐 Original dimensions: ${originalWidth}x${originalHeight}`);
          
          // Calculate new dimensions if resizing is needed (EXACT same logic as client-side)
          const maxWidth = 1080;
          const maxHeight = 1920;
          
          let newWidth = originalWidth;
          let newHeight = originalHeight;
          let wasResized = false;

          // Check if resizing is needed (exact same logic as client-side)
          if (originalWidth > maxWidth || originalHeight > maxHeight) {
            const aspectRatio = originalWidth / originalHeight;
            
            if (originalWidth > originalHeight) {
              // Landscape orientation
              newWidth = Math.min(maxWidth, originalWidth);
              newHeight = Math.round(newWidth / aspectRatio);
              
              if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = Math.round(newHeight * aspectRatio);
              }
            } else {
              // Portrait orientation
              newHeight = Math.min(maxHeight, originalHeight);
              newWidth = Math.round(newHeight * aspectRatio);
              
              if (newWidth > maxWidth) {
                newWidth = maxWidth;
                newHeight = Math.round(newWidth / aspectRatio);
              }
            }
            
            wasResized = true;
            console.log(`📏 Resized to: ${newWidth}x${newHeight}`);
          }

          // Create canvas with proper dimensions
          const canvas = new OffscreenCanvas(newWidth, newHeight);
          const ctx = canvas.getContext('2d')!;

          // Draw image on canvas (this removes all metadata and ICC profiles)
          // Use the exact same drawing as client-side
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convert to blob with same quality as client-side (0.92)
          canvas.convertToBlob({ 
            type: 'image/jpeg', 
            quality: 0.92 
          }).then(async (processedBlob) => {
            const processedBuffer = new Uint8Array(await processedBlob.arrayBuffer());
            
            console.log(`✅ Enhanced image processed for TikTok:`);
            console.log(`   - Original: ${originalWidth}x${originalHeight} (${Math.round(imageBuffer.length / 1024)}KB)`);
            console.log(`   - Processed: ${newWidth}x${newHeight} (${Math.round(processedBuffer.length / 1024)}KB)`);
            console.log(`   - Resized: ${wasResized ? 'Yes' : 'No'}`);
            console.log(`   - Format: JPEG, Quality: 92%, Metadata: Stripped`);
            
            // Clean up the URL
            URL.revokeObjectURL(imageUrl);
            
            resolve(processedBuffer);
          }).catch((error) => {
            console.error('❌ Error converting to blob:', error);
            URL.revokeObjectURL(imageUrl);
            reject(error);
          });
          
        } catch (error) {
          console.error('❌ Error in image processing:', error);
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Error loading image:', error);
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load image for processing'));
      };
      
      img.src = imageUrl;
    });
    
  } catch (error) {
    console.error('❌ Error in processImageForTikTok:', error);
    console.error('📋 Falling back to original image...');
    
    // Return original image if processing fails
    return imageBuffer;
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
  try {
    const requestBody = await req.json();
    const { productId, imageUrl, productName, brandName } = requestBody;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
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
    // Call GPT-4.1 with tool-based image generation
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
    const imageCall = responseData.output?.find((o)=>o.type === "image_generation_call");
    if (!imageCall || !imageCall.result) {
      throw new Error("No image data returned from GPT-4.1");
    }
    const generatedImageBase64 = imageCall.result;
    // Convert base64 to Uint8Array
    const enhancedImageBuffer = Uint8Array.from(atob(generatedImageBase64), (c)=>c.charCodeAt(0));
    
    // Process image for TikTok compatibility before uploading
    const processedImageBuffer = await processImageForTikTok(enhancedImageBuffer);
    
    const enhancedFileName = `enhanced-${productId}-${Date.now()}.jpg`; // Changed to .jpg for TikTok compatibility
    const { error: uploadError } = await supabase.storage.from("restaurant-images").upload(enhancedFileName, processedImageBuffer, {
      contentType: "image/jpeg", // Changed to JPEG for TikTok compatibility
      upsert: false
    });
    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error("Failed to upload enhanced image");
    }
    const enhancedImageUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${enhancedFileName}`;
    await supabase.from("products").update({
      enhanced_image_path: enhancedFileName,
      image_enhancement_status: "completed"
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
