import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing scheduled posts...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all scheduled posts that are due to be posted
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        products(image_path),
        images(file_path)
      `)
      .eq('status', 'scheduled')
      .eq('platform', 'tiktok')
      .lte('scheduled_date', now);

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled posts' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${duePosts?.length || 0} posts due for posting`);

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts due for posting', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Process each due post
    for (const post of duePosts) {
      try {
        console.log(`Processing post ${post.id}`);

        // Get the image/video URL
        const mediaPath = post.products?.image_path || post.images?.file_path;
        if (!mediaPath) {
          console.error(`No media found for post ${post.id}`);
          await supabase
            .from('scheduled_posts')
            .update({ status: 'failed' })
            .eq('id', post.id);
          failCount++;
          continue;
        }

        const videoUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${mediaPath}`;

        // Get user's TikTok connection
        const { data: connection, error: connectionError } = await supabase
          .from('profiles')
          .select('tiktok_access_token')
          .eq('id', post.user_id)
          .maybeSingle();

        if (connectionError || !connection || !connection.tiktok_access_token) {
          console.error(`No TikTok connection found for user ${post.user_id}`);
          await supabase
            .from('scheduled_posts')
            .update({ status: 'failed' })
            .eq('id', post.id);
          failCount++;
          continue;
        }

        // Call the post-to-tiktok function
        const postResponse = await supabase.functions.invoke('post-to-tiktok', {
          body: {
            scheduledPostId: post.id,
            videoUrl: videoUrl,
            caption: post.caption,
            tiktokAccessToken: connection.tiktok_access_token
          },
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
        });

        if (postResponse.error) {
          console.error(`Failed to post ${post.id} to TikTok:`, postResponse.error);
          failCount++;
        } else {
          console.log(`Successfully posted ${post.id} to TikTok`);
          successCount++;
        }

      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        await supabase
          .from('scheduled_posts')
          .update({ status: 'failed' })
          .eq('id', post.id);
        failCount++;
      }
    }

    console.log(`Processing complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        message: 'Scheduled posts processing complete',
        processed: duePosts.length,
        success: successCount,
        failed: failCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Process scheduled posts error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 