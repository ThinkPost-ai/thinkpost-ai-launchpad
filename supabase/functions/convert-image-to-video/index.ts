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
    const { imageUrl, duration = 3 } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Converting image to video: ${imageUrl}`);
    console.log(`Video duration: ${duration} seconds`);

    // TikTok video specifications
    const width = 1080;
    const height = 1920; // 9:16 aspect ratio
    const framerate = 30;

    // Create FFmpeg command for image-to-video conversion
    const ffmpegCommand = [
      'ffmpeg',
      '-loop', '1',
      '-i', imageUrl,
      '-c:v', 'libx264',
      '-t', duration.toString(),
      '-pix_fmt', 'yuv420p',
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
      '-r', framerate.toString(),
      '-movflags', '+faststart',
      '-f', 'mp4',
      'pipe:1'
    ];

    console.log('FFmpeg command:', ffmpegCommand.join(' '));

    // Execute FFmpeg
    const process = new Deno.Command('ffmpeg', {
      args: ffmpegCommand.slice(1), // Remove 'ffmpeg' from args
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      const errorOutput = new TextDecoder().decode(stderr);
      console.error('FFmpeg error:', errorOutput);
      return new Response(
        JSON.stringify({ error: 'Video conversion failed', details: errorOutput }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Video conversion successful');

    // Return the video as binary data
    return new Response(stdout, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="tiktok-video.mp4"',
      },
    });

  } catch (error) {
    console.error('Error in convert-image-to-video:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 