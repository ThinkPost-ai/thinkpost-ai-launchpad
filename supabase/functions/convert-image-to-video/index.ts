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
    const { imageUrl, userId, sessionId } = await req.json();
    
    if (!imageUrl || !userId || !sessionId) {
      throw new Error('Missing required parameters: imageUrl, userId, or sessionId');
    }

    console.log(`Converting image to video for user: ${userId}, session: ${sessionId}`);

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download the image from the provided URL
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // Create a temporary file for the image
    const tempImagePath = `/tmp/input_${Date.now()}.jpg`;
    await Deno.writeFile(tempImagePath, imageBytes);

    // Create output video path
    const tempVideoPath = `/tmp/output_${Date.now()}.mp4`;

    // FFmpeg command to convert image to video
    // Creates a 4-second video with the image, 720p resolution, TikTok-compatible format
    const ffmpegCommand = [
      'ffmpeg',
      '-loop', '1',
      '-i', tempImagePath,
      '-c:v', 'libx264',
      '-t', '4',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black',
      '-r', '30',
      '-movflags', '+faststart',
      '-y',
      tempVideoPath
    ];

    console.log('Running FFmpeg command:', ffmpegCommand.join(' '));

    // Execute FFmpeg command
    const process = new Deno.Command('ffmpeg', {
      args: ffmpegCommand.slice(1),
      stdout: 'piped',
      stderr: 'piped'
    });

    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error('FFmpeg error:', errorText);
      throw new Error(`FFmpeg conversion failed: ${errorText}`);
    }

    console.log('FFmpeg conversion successful');

    // Read the generated video file
    const videoBytes = await Deno.readFile(tempVideoPath);

    // Upload the video to Supabase Storage in the media bucket
    const videoFileName = `${userId}/${sessionId}/final_video.mp4`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(videoFileName, videoBytes, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    console.log('Video uploaded successfully:', uploadData.path);

    // Clean up temporary files
    try {
      await Deno.remove(tempImagePath);
      await Deno.remove(tempVideoPath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
    }

    // Return the public URL for the video
    const publicUrl = `https://thinkpost.co/media/${videoFileName}`;

    return new Response(JSON.stringify({
      success: true,
      videoUrl: publicUrl,
      storagePath: uploadData.path
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in convert-image-to-video function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 