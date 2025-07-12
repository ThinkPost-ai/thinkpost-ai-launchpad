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
    
    // Expected format: /media/filename.jpg
    // This allows simple routing from thinkpost.co/media/* -> supabase-function
    if (pathSegments.length < 2 || pathSegments[0] !== 'media') {
      console.log('Invalid path format:', url.pathname);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Get the filename from the path
    const filename = pathSegments[1];
    
    // All images are stored in the restaurant-images bucket
    const bucket = 'restaurant-images';
    
    console.log(`Serving media file: ${filename} from bucket: ${bucket}`);

    // Initialize Supabase client with service role key for storage access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const extension = filename.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
          return 'image/jpg';
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'bmp':
          return 'image/bmp';
        case 'svg':
          return 'image/svg+xml';
        case 'mp4':
          return 'video/mp4';
        case 'mov':
          return 'video/quicktime';
        case 'avi':
          return 'video/x-msvideo';
        case 'webm':
          return 'video/webm';
        default:
          return 'application/octet-stream';
      }
    };

    // Get the file from Supabase Storage
    // Try to find the file by searching for it in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { search: filename });

    if (listError || !files || files.length === 0) {
      console.error('File not found:', filename, listError);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Find the exact file match
    const file = files.find(f => f.name.endsWith(filename));
    if (!file) {
      console.error('Exact file match not found:', filename);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Download the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(file.name);

    if (error) {
      console.error('Storage download error:', error);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (!data) {
      console.log('No data returned for file:', filename);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const contentType = getContentType(filename);
    
    // Convert Blob to ArrayBuffer for direct serving
    const arrayBuffer = await data.arrayBuffer();

    console.log(`Successfully serving file: ${filename} (${contentType}) - ${arrayBuffer.byteLength} bytes`);

    // Return the file with TikTok-compatible headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error in media function:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}); 