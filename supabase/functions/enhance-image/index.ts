import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let enhancementId: string | null = null;

  try {
    const requestBody = await req.json();
    const { 
      enhancementId: reqEnhancementId, 
      contentType, 
      contentId, 
      imageUrl, 
      productName, 
      brandName 
    } = requestBody;
    
    enhancementId = reqEnhancementId;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update enhancement queue status to processing
    if (enhancementId) {
      await supabase
        .from('enhancement_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancementId);
    }

    console.log('Starting image enhancement process...');

    // Fetch original image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 1024;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8Array.slice(i, i + chunkSize));
    }
    const base64Image = btoa(binary);

    // Enhanced prompt for better results
    const prompt = `
    Enhance this image for marketing purposes.

    CRITICAL PRODUCT INTEGRITY RULES:
    - This image contains a ${productName || 'product'} that **must remain completely unaltered**.
    - **Do NOT modify, edit, move, retouch, or recreate any part of the product**, including:
      - Logos, Text (especially any Arabic text), Labels, Colors, Shapes, Branding elements
    - **No part of the product should be changed in any way.**

    Enhancement Guidelines (only outside the product):
    - Enhance lighting for a soft golden-hour glow that flatters the scene, **without affecting the product's original color**.
    - Subtly sharpen only the product edges for clarity, **without adding artificial effects**.
    - Gently blur the background to create depth, but **do not alter background content or introduce new elements**.
    - Remove visual distractions only if **they do not touch or overlap with the product**.
    - Adjust color balance and contrast for overall richness, but keep tones **natural and true to the original scene**.
    - Add subtle creative lighting or atmosphere ONLY if they **do not cover, touch, or obscure any part of the product**.

    Final result must look clean, professional, and premium — suitable for high-end food/café social media marketing.
    `;

    // Call OpenAI DALL-E API for image enhancement
    const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: createFormData(base64Image, prompt)
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const enhancedImageUrl = openaiData.data[0]?.url;

    if (!enhancedImageUrl) {
      throw new Error('No enhanced image URL received from OpenAI');
    }

    // Download enhanced image
    const enhancedImageResponse = await fetch(enhancedImageUrl);
    if (!enhancedImageResponse.ok) {
      throw new Error('Failed to download enhanced image');
    }

    const enhancedImageBlob = await enhancedImageResponse.blob();
    const enhancedImageBuffer = await enhancedImageBlob.arrayBuffer();

    // Generate unique filename for enhanced image
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const enhancedFileName = `enhanced_${contentId}_${timestamp}_${randomId}.jpg`;

    // Upload enhanced image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(enhancedFileName, enhancedImageBuffer, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      throw new Error(`Failed to upload enhanced image: ${uploadError.message}`);
    }

    const enhancedImagePath = uploadData.path;
    const enhancedImageStorageUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${enhancedImagePath}`;

    // Update content table with enhanced image path
    const table = contentType === 'product' ? 'products' : 'images';
    const { error: updateError } = await supabase
      .from(table)
      .update({
        enhanced_image_path: enhancedImagePath,
        image_enhancement_status: 'completed',
        enhancement_history: supabase.raw(`
          COALESCE(enhancement_history, '[]'::jsonb) || 
          '[{"enhanced_at": "${new Date().toISOString()}", "enhanced_path": "${enhancedImagePath}"}]'::jsonb
        `)
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('Failed to update content table:', updateError);
      // Continue anyway - the enhancement queue will be updated
    }

    // Update enhancement queue with completion
    if (enhancementId) {
      await supabase
        .from('enhancement_queue')
        .update({
          status: 'completed',
          enhanced_image_url: enhancedImageStorageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancementId);
    }

    console.log('Image enhancement completed successfully');

    return new Response(JSON.stringify({
      success: true,
      enhancedImageUrl: enhancedImageStorageUrl,
      enhancedImagePath: enhancedImagePath,
      enhancementId: enhancementId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in enhance-image function:', error);

    // Update enhancement queue with error if we have the ID
    if (enhancementId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('enhancement_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', enhancementId);
      } catch (updateError) {
        console.error('Failed to update enhancement queue with error:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      enhancementId: enhancementId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to create FormData for OpenAI API
function createFormData(base64Image: string, prompt: string): FormData {
  const formData = new FormData();
  
  // Convert base64 to blob
  const binaryString = atob(base64Image);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const imageBlob = new Blob([bytes], { type: 'image/jpeg' });
  
  formData.append('image', imageBlob, 'image.jpg');
  formData.append('prompt', prompt);
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  
  return formData;
}
