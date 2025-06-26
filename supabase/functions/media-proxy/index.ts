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
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extract bucket and file path from URL
    // Expected format: /media-proxy/bucket/file-path
    if (pathSegments.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid path. Expected format: /media-proxy/bucket/file-path' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const bucket = pathSegments[1]; // Skip 'media-proxy'
    const filePath = pathSegments.slice(2).join('/');

    console.log(`Serving media from bucket: ${bucket}, path: ${filePath}`);

    // Initialize Supabase client with service role key for storage access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      return new Response(
        JSON.stringify({ error: 'File not found', details: error.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine content type based on file extension
    const getContentType = (filePath: string): string => {
      const extension = filePath.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'mp4':
          return 'video/mp4';
        case 'mov':
          return 'video/quicktime';
        case 'avi':
          return 'video/x-msvideo';
        case 'webm':
          return 'video/webm';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        default:
          return 'application/octet-stream';
      }
    };

    const contentType = getContentType(filePath);
    
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    console.log(`Serving file: ${filePath} (${contentType}) - ${arrayBuffer.byteLength} bytes`);

    // Return the file with appropriate headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error in media-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 