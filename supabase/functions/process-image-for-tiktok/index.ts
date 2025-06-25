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
    const { imageUrl, caption, publishToTikTok = false } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Image URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    console.log(`Processing image for user: ${user.id}`);

    // Generate a unique session ID for this conversion
    const sessionId = crypto.randomUUID();

    // Step 1: Convert image to video
    console.log('Starting image to video conversion...');
    
    const convertResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/convert-image-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        userId: user.id,
        sessionId,
      }),
    });

    const convertData = await convertResponse.json();

    if (!convertResponse.ok || !convertData.success) {
      throw new Error(`Image conversion failed: ${convertData.error || 'Unknown error'}`);
    }

    console.log('Image conversion successful:', convertData.videoUrl);

    // Step 2: Generate public URL for the video
    const publicVideoUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/media-proxy/${user.id}/${sessionId}/final_video.mp4`;

    console.log('Generated public video URL:', publicVideoUrl);

    // Step 3: Store the video record in the database
    const { data: videoRecord, error: insertError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        url: convertData.videoUrl, // Store the direct storage URL
        public_url: publicVideoUrl, // Store the public proxy URL
        file_name: `final_video_${sessionId}.mp4`,
        file_size: 0, // Will be updated later if needed
        mime_type: 'video/mp4',
        caption: caption || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting video record:', insertError);
      throw new Error(`Failed to save video record: ${insertError.message}`);
    }

    console.log('Video record created:', videoRecord.id);

    // Step 4: If publishToTikTok is true, publish to TikTok
    let tiktokResult = null;
    if (publishToTikTok && caption) {
      console.log('Publishing to TikTok...');
      
      try {
        // Create a scheduled post record first
        const { data: scheduledPost, error: scheduleError } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: user.id,
            caption,
            image_id: videoRecord.id,
            scheduled_time: new Date().toISOString(),
            status: 'pending',
            platform: 'tiktok'
          })
          .select()
          .single();

        if (scheduleError) {
          console.error('Error creating scheduled post:', scheduleError);
          throw new Error(`Failed to create scheduled post: ${scheduleError.message}`);
        }

        // Call the TikTok posting function
        const tiktokResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/post-to-tiktok`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: publicVideoUrl,
            caption,
            scheduledPostId: scheduledPost.id,
          }),
        });

        const tiktokData = await tiktokResponse.json();

        if (tiktokResponse.ok) {
          tiktokResult = {
            success: true,
            publishId: tiktokData.publishId,
            message: tiktokData.message,
          };
          console.log('TikTok posting successful:', tiktokResult);
        } else {
          tiktokResult = {
            success: false,
            error: tiktokData.error || 'TikTok posting failed',
          };
          console.error('TikTok posting failed:', tiktokResult);
        }
      } catch (tiktokError) {
        console.error('Error during TikTok posting:', tiktokError);
        tiktokResult = {
          success: false,
          error: tiktokError.message || 'TikTok posting failed',
        };
      }
    }

    // Return the complete result
    const result = {
      success: true,
      videoId: videoRecord.id,
      videoUrl: convertData.videoUrl,
      publicVideoUrl,
      sessionId,
      tiktok: tiktokResult,
    };

    console.log('Process completed successfully:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-image-for-tiktok function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 