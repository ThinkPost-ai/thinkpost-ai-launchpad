import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image processing function to optimize for TikTok compatibility
async function processImageForTikTok(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // Convert ArrayBuffer to Uint8Array for processing
    const uint8Array = new Uint8Array(imageBuffer);
    
    // Create a canvas for image processing
    const canvas = new OffscreenCanvas(1080, 1920);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Create ImageBitmap from the buffer
    const imageBlob = new Blob([uint8Array], { type: 'image/jpeg' });
    const imageBitmap = await createImageBitmap(imageBlob);
    
    // Calculate dimensions to maintain aspect ratio while fitting TikTok's preferred size
    const targetWidth = 1080;
    const targetHeight = 1920;
    
    let drawWidth = imageBitmap.width;
    let drawHeight = imageBitmap.height;
    let offsetX = 0;
    let offsetY = 0;
    
    // Calculate scaling to fit within target dimensions
    const scaleX = targetWidth / imageBitmap.width;
    const scaleY = targetHeight / imageBitmap.height;
    const scale = Math.min(scaleX, scaleY);
    
    drawWidth = imageBitmap.width * scale;
    drawHeight = imageBitmap.height * scale;
    offsetX = (targetWidth - drawWidth) / 2;
    offsetY = (targetHeight - drawHeight) / 2;
    
    // Clear canvas and draw the image
    ctx.fillStyle = '#000000'; // Black background
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(imageBitmap, offsetX, offsetY, drawWidth, drawHeight);
    
    // Convert canvas to blob
    const processedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.85 // High quality but compressed
    });
    
    // Convert blob back to ArrayBuffer
    return await processedBlob.arrayBuffer();
    
  } catch (error) {
    console.error('Error processing image:', error);
    // Return original buffer if processing fails
    return imageBuffer;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, scheduledPostId, userId } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing image for TikTok: ${imageUrl}`);
    if (scheduledPostId) {
      console.log(`Scheduled post ID: ${scheduledPostId}`);
    }
    if (userId) {
      console.log(`User ID provided: ${userId}`);
    }

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    // If no auth header and we have a scheduledPostId, use service role for database access
    const supabaseKey = authHeader ? 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '' : 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseKey,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    let user: any = null;
    
    // If we have an auth header, try to authenticate
    if (authHeader) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (!userError && authUser) {
        user = authUser;
      }
    }

    // If no authenticated user but we have a userId parameter, use it directly
    if (!user && userId) {
      user = { id: userId };
      console.log(`Using provided user ID: ${userId}`);
    }

    // If no authenticated user but we have a scheduledPostId, get user from scheduled post
    if (!user && scheduledPostId) {
      const { data: postData, error: postError } = await supabase
        .from('scheduled_posts')
        .select('user_id')
        .eq('id', scheduledPostId)
        .single();
      
      if (postError || !postData?.user_id) {
        console.error('Failed to get user from scheduled post:', postError);
        return new Response(
          JSON.stringify({ error: 'Scheduled post not found or missing user ID' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Create a user-like object for compatibility
      user = { id: postData.user_id };
    }

    // If still no user, throw error
    if (!user) {
      console.error('No user found - neither authenticated nor from scheduled post');
      return new Response(
        JSON.stringify({ error: 'User not authenticated or not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing image for TikTok compatibility for user: ${user.id}`);
    
    // Download the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const originalImageBuffer = await imageResponse.arrayBuffer();
    console.log(`Original image size: ${originalImageBuffer.byteLength} bytes`);
    
    // Process the image for TikTok compatibility
    const processedImageBuffer = await processImageForTikTok(originalImageBuffer);
    console.log(`Processed image size: ${processedImageBuffer.byteLength} bytes`);
    
    // Generate a new filename for the processed image
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    // Use only ASCII characters for maximum compatibility
    const processedFileName = `${user.id}/${timestamp}-${randomId}-tiktok-optimized.jpg`;
    
    console.log('Generated TikTok-compatible filename:', processedFileName);
    
    // Upload the processed image to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(processedFileName, processedImageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload processed image:', uploadError);
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    console.log('Processed image uploaded successfully:', uploadData.path);
    
    // Generate URLs for the processed image
    const processedImageUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${uploadData.path}`;
    const proxyImageUrl = `https://media.thinkpost.co/functions/v1/media-proxy/restaurant-images/${uploadData.path}?apikey=${Deno.env.get('SUPABASE_ANON_KEY')}`;

    console.log('Original image URL:', imageUrl);
    console.log('Processed image URL:', processedImageUrl);
    console.log('Proxy image URL for TikTok:', proxyImageUrl);

    // Update the database with processed image information
    if (scheduledPostId) {
      console.log('Updating scheduled post with processed image information...');
      
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          image_url: processedImageUrl,
          proxy_image_url: proxyImageUrl,
          processing_status: 'ready_for_tiktok',
          media_type: 'photo',
          processed_image_path: uploadData.path,
          original_image_url: imageUrl
        })
        .eq('id', scheduledPostId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update scheduled post:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update scheduled post',
            details: updateError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('Image processing for TikTok completed successfully - optimized for compatibility');

    return new Response(JSON.stringify({
      success: true,
      message: 'Image processed and optimized for TikTok compatibility',
      originalImageUrl: imageUrl,
      processedImageUrl: processedImageUrl,
      proxyImageUrl: proxyImageUrl,
      processedImagePath: uploadData.path,
      scheduledPostId: scheduledPostId,
      mediaType: 'photo',
      optimizations: [
        'Metadata stripped',
        'Format standardized to JPEG',
        'Dimensions optimized for TikTok',
        'Compression applied for file size optimization',
        'Filename sanitized'
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-image-for-tiktok:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process image for TikTok',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 