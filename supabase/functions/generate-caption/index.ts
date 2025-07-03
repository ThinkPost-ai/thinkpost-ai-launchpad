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
    // Check environment variables
    if (!openAIApiKey) {
      console.error('Missing OPENAI_API_KEY environment variable');
      throw new Error('OpenAI API key not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Supabase not configured properly');
    }

    console.log('Environment check passed');

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    console.log('Authorization header found');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to verify user token');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      throw new Error('Invalid token or user not found');
    }

    console.log('User authenticated successfully:', user.id);

    // Check and decrement caption credits
    console.log('Checking caption credits for user:', user.id);
    const { data: creditsData, error: creditsError } = await supabase.rpc('decrement_caption_credits', {
      user_id: user.id
    });

    if (creditsError) {
      console.error('Credits check failed:', creditsError);
      throw new Error('Failed to check caption credits');
    }

    console.log('Credits remaining after decrement:', creditsData);

    if (creditsData === 0) {
      console.log('User has no remaining credits');
      return new Response(JSON.stringify({ 
        error: 'Insufficient caption credits. You have reached your monthly limit.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { productName, price, description } = requestBody;
    
    console.log('Caption generation request:', { productName, price, description });

    const prompt = `أنت صانع محتوى محترف ومبدع من السعودية، ومتخصص في التسويق للمطاعم والأكلات على وسائل التواصل الاجتماعي.
اكتب وصف جذاب ومشهي (بين 100 إلى 200 حرف) لمنشور على إنستغرام عن الطبق التالي:

اسم المنتج: ${productName}

السعر: $${price}

الوصف: ${description}

التعليمات:

استخدم كلمات سعودية حسّية توصف الطعم أو الريحة أو الملمس بشكل يخلّي المتابع يشتهي الطبق.

وضّح وش يميز الطبق عن غيره بطريقة مشوّقة.

أضف هاشتاقات محلية مشهورة مثل: #مطاعم_السعودية #جدة_ذوق #الرياض_تايمز

لازم تكون النبرة حماسية، محلية، لكن مرتبة ومحترفة.

لا تستخدم عبارات عامة أو مكررة، خلك واقعي وودود كأنك تتكلم مع الناس في سناب أو إنستا.

عدد الأحرف بين 100 و200 كحد أقصى.`;

    console.log('Calling OpenAI API...');
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

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const caption = data.choices[0].message.content;

    console.log('Caption generated successfully:', caption);

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
