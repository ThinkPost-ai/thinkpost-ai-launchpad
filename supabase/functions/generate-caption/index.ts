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

    // Get brand information for the user
    console.log('Fetching brand information for user:', user.id);
    const { data: brandData, error: brandError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (brandError) {
      console.error('Error fetching brand data:', brandError);
      throw new Error('Failed to fetch brand information');
    }

    if (!brandData) {
      console.error('No brand data found for user:', user.id);
      throw new Error('Brand information not found. Please complete your brand setup first.');
    }

    console.log('Brand data retrieved:', brandData);

    const requestBody = await req.json();
    const { productName, price, description } = requestBody;
    
    console.log('Caption generation request:', { productName, price, description });

    // Prepare brand information for the prompt
    const brandName = brandData.name;
    const brandType = brandData.brand_type || 'other';
    const visionAndValues = brandData.vision || 'تقديم أفضل تجربة للعملاء';
    
    // Handle locations - combine primary location and additional locations
    let brandLocations = [brandData.location];
    if (brandData.additional_locations && brandData.additional_locations.length > 0) {
      brandLocations = brandLocations.concat(brandData.additional_locations);
    }
    
    // Handle "Other" location with custom input
    if (brandData.custom_location) {
      brandLocations = brandLocations.map(loc => 
        loc === 'Other' ? brandData.custom_location : loc
      );
    }
    
    const brandLocationsText = brandLocations.join('، ');
    
    // Handle restaurant category (only for restaurants)
    let restaurantCategory = '';
    if (brandType === 'restaurant') {
      if (brandData.category === 'other' && brandData.custom_category) {
        restaurantCategory = brandData.custom_category;
      } else {
        // Map category enum to Arabic
        const categoryMap = {
          'fast_food': 'وجبات سريعة',
          'casual_dining': 'مطاعم عائلية',
          'fine_dining': 'مطاعم راقية',
          'middle_eastern': 'مأكولات شرق أوسطية',
          'asian': 'مأكولات آسيوية',
          'italian': 'مأكولات إيطالية',
          'american': 'مأكولات أمريكية',
          'seafood': 'مأكولات بحرية',
          'vegetarian': 'مأكولات نباتية',
          'cafe': 'مقهى',
          'bakery': 'مخبز',
          'other': 'أخرى'
        };
        restaurantCategory = categoryMap[brandData.category] || brandData.category;
      }
    }

    // Select prompt template based on brand_type
    let prompt = '';
    
    if (brandType === 'restaurant') {
      prompt = `أنت كاتب محتوى محترف لمنصة TikTok. المطلوب كتابة وصف مختصر وجذاب يُستخدم مع صورة منتج غذائي من مطعم.

معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- فئة المطعم: ${restaurantCategory}
- رؤية العلامة التجارية: ${visionAndValues}

معلومات المنتج:
- اسم المنتج: ${productName}
- السعر: ${price} ريال
- وصف المنتج: ${description}

التعليمات:
اكتب وصفًا مميزًا لمنشور TikTok يحتوي على صورة هذا المنتج. اجعل أول جملة تشد الانتباه، ثم صف المنتج بلغة شهية وجذابة، واختتم بنداء خفيف مثل "لا تفوّت التجربة".
اجعل النص يعكس هوية المطعم وفئته.`;
    } else if (brandType === 'coffee') {
      prompt = `أنت مسؤول عن كتابة محتوى لمنشورات TikTok الخاصة بمقهى.

معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية العلامة التجارية: ${visionAndValues}

معلومات المنتج:
- اسم المنتج: ${productName}
- السعر: ${price} ريال
- وصف المنتج: ${description}

التعليمات:
ابدأ بجملة ملفتة، ثم تحدث عن النكهة أو تجربة الزبون.
اختم بجملة تشجيعية.`;
    } else if (brandType === 'bakery') {
      prompt = `اكتب وصفًا لمنشور TikTok مخصص لصورة منتج حلا أو مخبوزات.

معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية العلامة التجارية: ${visionAndValues}

معلومات المنتج:
- اسم المنتج: ${productName}
- السعر: ${price} ريال
- وصف المنتج: ${description}

التعليمات:
ابدأ بجملة مغرية، صف النكهة والمكونات،`;
    } else {
      // brand_type === 'other' or any other value
      prompt = `اكتب وصفًا قصيرًا وجذابًا لصورة منتج من علامة تجارية في مجال غير تقليدي.

معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية العلامة التجارية: ${visionAndValues}

معلومات المنتج:
- اسم المنتج: ${productName}
- السعر: ${price} ريال
- وصف المنتج: ${description}

التعليمات:
ابدأ بجملة تبرز فائدة المنتج، ثم صفه، وانهِ بنداء للتفاعل أو التجربة.`;
    }

    console.log('Using prompt template for brand type:', brandType);
    console.log('Generated prompt:', prompt);

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
          { role: 'system', content: 'You are a professional social media content creator specializing in TikTok captions for brands in Saudi Arabia. Generate engaging, authentic Arabic captions that reflect the brand identity and appeal to the Saudi audience.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
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
