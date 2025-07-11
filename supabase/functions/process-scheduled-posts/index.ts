
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
    console.log('[AUTO-POST] Processing scheduled posts automatically...');
    
    // Use service role key directly - no authentication required for this internal function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all scheduled posts that are due to be posted AND have been reviewed and approved
    const now = new Date().toISOString();
    console.log(`[AUTO-POST] Checking for posts due before: ${now}`);
    
    const { data: duePosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        products(image_path),
        images(file_path)
      `)
      .eq('status', 'scheduled')
      .eq('platform', 'tiktok')
      .eq('reviewed_and_approved', true)
      .lte('scheduled_date', now);

    if (fetchError) {
      console.error('[AUTO-POST] Error fetching due posts:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled posts' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[AUTO-POST] Found ${duePosts?.length || 0} reviewed and approved posts due for posting`);

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reviewed and approved posts due for posting', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Process each due post immediately
    for (const post of duePosts) {
      try {
        console.log(`[AUTO-POST] Processing post ${post.id} scheduled for ${post.scheduled_date}`);

        // Get the media path
        const mediaPath = post.products?.image_path || post.images?.file_path;
        if (!mediaPath) {
          console.error(`[AUTO-POST] No media found for post ${post.id}`);
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          failCount++;
          continue;
        }

        // Get user's TikTok connection first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at')
          .eq('id', post.user_id)
          .maybeSingle();

        if (profileError || !profile || !profile.tiktok_access_token) {
          console.error(`[AUTO-POST] No TikTok connection found for user ${post.user_id}`);
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          failCount++;
          continue;
        }

        // Determine media type and construct URL
        const isVideo = mediaPath.toLowerCase().endsWith('.mp4') || 
                       mediaPath.toLowerCase().endsWith('.mov') || 
                       mediaPath.toLowerCase().endsWith('.avi') ||
                       mediaPath.toLowerCase().endsWith('.webm');

        const mediaUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${mediaPath}`;
        
        console.log(`[AUTO-POST] Media type: ${isVideo ? 'video' : 'photo'}, URL: ${mediaUrl}`);

        // Get TikTok settings from the post or use defaults
        const tiktokSettings = {
          privacyLevel: post.tiktok_privacy_level || 'PUBLIC_TO_EVERYONE',
          allowComment: post.tiktok_allow_comments ?? true,
          allowDuet: !post.tiktok_disable_duet,
          allowStitch: !post.tiktok_disable_stitch,
          commercialContent: post.tiktok_commercial_content || false,
          yourBrand: post.tiktok_your_brand || false,
          brandedContent: post.tiktok_branded_content || false
        };

        console.log(`[AUTO-POST] Using TikTok settings:`, tiktokSettings);

        // Post directly to TikTok using the post-to-tiktok function
        const postResponse = await supabase.functions.invoke('post-to-tiktok', {
          body: {
            scheduledPostId: post.id,
            videoUrl: mediaUrl,
            caption: post.caption,
            title: post.title || post.caption?.substring(0, 90),
            description: post.description || post.caption,
            privacyLevel: tiktokSettings.privacyLevel,
            allowComment: tiktokSettings.allowComment,
            allowDuet: tiktokSettings.allowDuet,
            allowStitch: tiktokSettings.allowStitch,
            commercialContent: tiktokSettings.commercialContent,
            yourBrand: tiktokSettings.yourBrand,
            brandedContent: tiktokSettings.brandedContent
          },
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
        });

        if (postResponse.error) {
          console.error(`[AUTO-POST] Failed to post ${post.id} to TikTok:`, postResponse.error);
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          failCount++;
        } else {
          console.log(`[AUTO-POST] ✅ Successfully posted ${post.id} to TikTok`);
          // The post-to-tiktok function already updates the status to 'posted'
          successCount++;
        }

      } catch (error) {
        console.error(`[AUTO-POST] Error processing post ${post.id}:`, error);
        await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
        failCount++;
      }
    }

    const result = {
      message: 'Scheduled posts processing complete',
      processed: duePosts.length,
      success: successCount,
      failed: failCount,
      timestamp: new Date().toISOString()
    };

    console.log(`[AUTO-POST] Processing complete:`, result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[AUTO-POST] Process scheduled posts error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
