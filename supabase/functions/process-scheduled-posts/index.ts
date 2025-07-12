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
    console.log('🔄 Processing scheduled posts for TikTok compatibility...');

    // Use service role key for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all scheduled posts with pending processing status
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('id, user_id, image_url, original_image_url, processing_status')
      .eq('processing_status', 'pending')
      .eq('platform', 'tiktok')
      .eq('status', 'scheduled')
      .limit(10); // Process in batches

    if (fetchError) {
      console.error('Error fetching pending posts:', fetchError);
      throw fetchError;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      console.log('✅ No pending posts to process');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending posts to process',
        processed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${pendingPosts.length} posts to process`);

    let processed = 0;
    let failed = 0;

    // Process each post
    for (const post of pendingPosts) {
      try {
        console.log(`🖼️ Processing post ${post.id} for user ${post.user_id}`);

        // Update status to processing
        await supabase
          .from('scheduled_posts')
          .update({ processing_status: 'processing' })
          .eq('id', post.id);

        // Call the image processing function
        const { data: processData, error: processError } = await supabase.functions.invoke('process-image-for-tiktok', {
          body: {
            imageUrl: post.image_url || post.original_image_url,
            scheduledPostId: post.id,
            userId: post.user_id
          }
        });

        if (processError) {
          console.error(`❌ Processing failed for post ${post.id}:`, processError);
          
          // Update status to failed
          await supabase
            .from('scheduled_posts')
            .update({ processing_status: 'failed' })
            .eq('id', post.id);
          
          failed++;
        } else {
          console.log(`✅ Successfully processed post ${post.id}`);
          processed++;
        }

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
        
        // Update status to failed
        await supabase
          .from('scheduled_posts')
          .update({ processing_status: 'failed' })
          .eq('id', post.id);
        
        failed++;
      }
    }

    console.log(`📊 Processing complete: ${processed} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processed} posts successfully, ${failed} failed`,
      processed: processed,
      failed: failed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in process-scheduled-posts:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process scheduled posts',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 