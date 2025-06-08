import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tiktok-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Received TikTok Webhook Payload:', JSON.stringify(payload, null, 2));

    // TikTok Webhook Verification (Challenge Response)
    if (payload.challenge) {
      console.log('Responding to TikTok webhook challenge.');
      return new Response(JSON.stringify({ challenge: payload.challenge }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for database operations
    );

    // Process TikTok Webhook Events
    if (payload.data && Array.isArray(payload.data)) {
      for (const event of payload.data) {
        if (event.event === 'video_post_status_change') {
          const { client_key, publish_id, status } = event.data;
          console.log(`Video Post Status Change: Publish ID: ${publish_id}, Status: ${status}`);

          // You might want to filter by client_key if you have multiple TikTok apps
          // For now, we'll focus on updating the scheduled_posts table based on publish_id
          
          let newStatus: 'scheduled' | 'posted' | 'failed' = 'scheduled';
          if (status === 'PUBLISHED') {
            newStatus = 'posted';
          } else if (status === 'FAILED') {
            newStatus = 'failed';
          } else if (status === 'IN_REVIEW' || status === 'PROCESSING_UPLOAD') {
            newStatus = 'scheduled'; // Still processing
          }

          if (publish_id) {
            console.log(`Updating scheduled_posts for publish_id: ${publish_id} to status: ${newStatus}`);
            const { error: updateError } = await supabase
              .from('scheduled_posts')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('tiktok_publish_id', publish_id); // Assuming you store the publish_id in your table

            if (updateError) {
              console.error('Error updating scheduled post status in DB:', updateError);
            }
          } else {
            console.warn('Webhook event missing publish_id:', event);
          }
        } else {
          console.log(`Received unhandled event type: ${event.event}`);
        }
      }
    }

    return new Response('ok', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error processing TikTok webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 