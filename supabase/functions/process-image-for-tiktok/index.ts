import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, scheduledPostId } = await req.json();

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

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    // Authenticate the user to get their ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated or not found.');
    }

    console.log('Preparing image for direct TikTok posting...');
    
    // TikTok supports posting images directly - no video conversion needed!
    // We just need to ensure the image URL is accessible for TikTok's API
    
    // Generate media-proxy URL to ensure domain verification for TikTok posting
    const imageUrlParts = imageUrl.split('/');
    const imagePath = imageUrlParts.slice(-2).join('/'); // Get the last two parts (user_id/filename)
    const proxyImageUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/media-proxy/media/${imagePath}`;

    console.log('Original image URL:', imageUrl);
    console.log('Proxy image URL for TikTok:', proxyImageUrl);

    // Update the database with image information for TikTok posting
    if (scheduledPostId) {
      console.log('Updating scheduled post with image information...');
      
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          image_url: imageUrl,
          proxy_image_url: proxyImageUrl,
          processing_status: 'ready_for_tiktok',
          media_type: 'photo' // TikTok supports photo posts directly
        })
        .eq('id', scheduledPostId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update scheduled post:', updateError);
        throw new Error(`Failed to update scheduled post: ${updateError.message}`);
      }
    }

    console.log('Image processing for TikTok completed successfully - ready for direct photo posting');

    return new Response(JSON.stringify({
      success: true,
      message: 'Image ready for direct TikTok photo posting',
      imageUrl: imageUrl,
      proxyImageUrl: proxyImageUrl,
      scheduledPostId: scheduledPostId,
      mediaType: 'photo',
      note: 'TikTok supports photo posts directly - no video conversion needed'
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