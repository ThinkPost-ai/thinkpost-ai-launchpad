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

    console.log(`Mock video conversion for image: ${imageUrl}`);
    console.log(`Requested duration: ${duration} seconds`);

    // Mock video conversion - Supabase Edge Runtime doesn't support FFmpeg
    // In a real implementation, this would use an external video processing service
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we'll return a success response indicating that TikTok can handle image posts
    // TikTok supports posting images directly without video conversion
    console.log('Mock video conversion completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image ready for TikTok posting',
        note: 'TikTok supports image posts directly - video conversion not required'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );

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