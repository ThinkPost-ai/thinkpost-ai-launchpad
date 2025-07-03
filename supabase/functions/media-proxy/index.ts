import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests for media serving
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extract path after /media-proxy/
    // Expected format: /media-proxy/bucket/file-path
    // Or: /media-proxy/restaurant-images/user-id/filename.jpg
    if (pathSegments.length < 3 || pathSegments[0] !== 'media-proxy') {
      console.log('Invalid path format:', url.pathname);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Extract bucket and file path
    const bucket = pathSegments[1]; // e.g., 'restaurant-images'
    const filePath = pathSegments.slice(2).join('/'); // e.g., 'user-id/filename.jpg'

    console.log(`[MEDIA-PROXY] Serving media from bucket: ${bucket}, path: ${filePath}`);

    // Initialize Supabase client with service role key for storage access
    // This bypasses all authentication and RLS requirements
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      }
    );

    // Determine content type based on file extension
    const getContentType = (filePath: string): string => {
      const extension = filePath.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
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
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('[MEDIA-PROXY] Storage download error:', error);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (!data) {
      console.log('[MEDIA-PROXY] No data returned for file:', filePath);
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const contentType = getContentType(filePath);
    
    // Convert Blob to ArrayBuffer for direct serving
    const arrayBuffer = await data.arrayBuffer();

    console.log(`[MEDIA-PROXY] Successfully serving file: ${filePath} (${contentType}) - ${arrayBuffer.byteLength} bytes`);

    // Return the file with appropriate headers for external services like TikTok
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        // Additional headers for better compatibility
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('[MEDIA-PROXY] Error in media-proxy:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});
