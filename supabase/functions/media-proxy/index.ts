import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET and HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Extract the file path from the URL
    // Expected format: /media-proxy/user_id/session_id/final_video.mp4
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    
    if (pathParts.length < 2 || pathParts[0] !== 'media-proxy') {
      return new Response('Invalid path format', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Remove 'media-proxy' from the path to get the actual file path
    const filePath = pathParts.slice(1).join('/');
    
    console.log(`Proxying request for file: ${filePath}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      if (error.message.includes('not found')) {
        return new Response('File not found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }
      return new Response('Storage error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    if (!data) {
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Determine content type based on file extension
    const contentType = filePath.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';
    
    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Return the file with appropriate headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Length': arrayBuffer.byteLength.toString(),
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Accept-Ranges': 'bytes',
    };

    return new Response(arrayBuffer, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in media-proxy function:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}); 