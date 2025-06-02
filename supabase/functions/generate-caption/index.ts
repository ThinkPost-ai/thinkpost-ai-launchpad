
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token or user not found');
    }

    // Check and decrement caption credits
    const { data: creditsData, error: creditsError } = await supabase.rpc('decrement_caption_credits', {
      user_id: user.id
    });

    if (creditsError) {
      throw new Error('Failed to check caption credits');
    }

    if (creditsData === 0) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient caption credits. You have reached your monthly limit.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { productName, price, description } = await req.json();

    const prompt = `You are a creative social media content creator specializing in food and restaurant marketing. Create an engaging, mouth-watering caption for the following dish:

Product Name: ${productName}
Price: $${price}
Description: ${description}

Write a compelling social media caption that:
- Highlights the most appealing aspects of the dish
- Uses sensory language to make readers crave the food
- Includes relevant food hashtags
- Maintains an enthusiastic but professional tone
- Is optimized for social media engagement

Keep the caption between 100-200 characters for optimal social media performance.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional social media content creator specializing in food and restaurant marketing.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const caption = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      caption,
      remainingCredits: creditsData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-caption function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
