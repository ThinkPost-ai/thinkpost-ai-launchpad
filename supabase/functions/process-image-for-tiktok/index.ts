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
    const { imageUrl, duration = 3, scheduledPostId } = await req.json();

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
    console.log(`Video duration: ${duration} seconds`);
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

    // Step 1: Convert image to video using the convert-image-to-video function
    console.log('Step 1: Converting image to video...');
    
    const convertResponse = await supabase.functions.invoke('convert-image-to-video', {
      body: { imageUrl, duration },
      headers: {
        Authorization: authHeader!,
      },
    });

    if (convertResponse.error) {
      console.error('Image to video conversion failed:', convertResponse.error);
      throw new Error(`Image to video conversion failed: ${convertResponse.error.message}`);
    }

    // Get the video data as blob
    const videoBlob = convertResponse.data;
    if (!videoBlob) {
      throw new Error('No video data received from conversion');
    }

    console.log('Video conversion successful, uploading to storage...');

    // Step 2: Upload the video to Supabase Storage
    const videoFileName = `tiktok-video-${Date.now()}-${user.id}.mp4`;
    const videoPath = `${user.id}/${videoFileName}`;

    // Convert blob to File for upload
    const videoFile = new File([videoBlob], videoFileName, { type: 'video/mp4' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(videoPath, videoFile, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.error('Video upload failed:', uploadError);
      throw new Error(`Video upload failed: ${uploadError.message}`);
    }

    console.log('Video uploaded successfully:', uploadData.path);

    // Step 3: Generate public URL for the video
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(uploadData.path);

    const publicVideoUrl = urlData.publicUrl;
    
    // Also generate media-proxy URL for TikTok posting (to ensure domain verification)
    const proxyVideoUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/media-proxy/media/${uploadData.path}`;

    console.log('Public video URL:', publicVideoUrl);
    console.log('Proxy video URL:', proxyVideoUrl);

    // Step 4: Update the database with video information
    if (scheduledPostId) {
      console.log('Updating scheduled post with video information...');
      
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          video_path: uploadData.path,
          video_url: publicVideoUrl,
          proxy_video_url: proxyVideoUrl,
          processing_status: 'completed'
        })
        .eq('id', scheduledPostId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update scheduled post:', updateError);
        // Don't throw here, video was created successfully
      }
    }

    // Step 5: Store video information in images table for future reference
    const { error: insertError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        file_path: uploadData.path,
        url: publicVideoUrl,
        public_url: proxyVideoUrl,
        file_name: videoFileName,
        mime_type: 'video/mp4',
        file_size: videoFile.size,
        original_filename: videoFileName
      });

    if (insertError) {
      console.error('Failed to store video information:', insertError);
      // Don't throw here, video was created successfully
    }

    console.log('Image to TikTok video processing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Image successfully converted to TikTok video',
      videoPath: uploadData.path,
      publicVideoUrl: publicVideoUrl,
      proxyVideoUrl: proxyVideoUrl,
      scheduledPostId: scheduledPostId
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