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

    // Check credits first before decrementing (we'll need credits for 3 captions)
    console.log('Checking caption credits for user:', user.id);
    const { data: currentCredits, error: creditsCheckError } = await supabase
      .from('profiles')
      .select('caption_credits')
      .eq('id', user.id)
      .single();

    if (creditsCheckError) {
      console.error('Credits check failed:', creditsCheckError);
      throw new Error('Failed to check operation credits');
    }

    console.log('Current credits before operation:', currentCredits?.caption_credits);

    // We need at least 3 credits for 3 captions
    if (!currentCredits || currentCredits.caption_credits < 3) {
      console.log('User has insufficient credits for 3 captions');
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. You need at least 3 credits to generate multiple captions.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrement credits for 3 operations
    console.log('Decrementing credits for 3 caption generations...');
    for (let i = 0; i < 3; i++) {
      const { data: creditsData, error: creditsError } = await supabase.rpc('decrement_operation_credits', {
        p_user_id: user.id,
        operation_type: 'content_generation'
      });

      if (creditsError) {
        console.error('Credits decrement failed:', creditsError);
        throw new Error('Failed to decrement operation credits');
      }
    }

    console.log('Credits decremented successfully for 3 captions');

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
    const { productName, price, description, contentType, contentCategory } = requestBody;
    
    console.log('Multiple caption generation request:', { productName, price, description, contentType, contentCategory });

    // Prepare brand information for the prompt (shared across all brand types and content types)
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

    // Map content categories to Arabic for better prompt context
    const contentCategoryMap = {
      'venue': 'مشاهد من المكان',
      'busy': 'لحظات مزدحمة',
      'preparation': 'طريقة التحضير',
      'atmosphere': 'أجواء عامة',
      'behindScenes': 'كواليس العمل',
      'customerMessages': 'رسائل من العملاء',
      'educational': 'محتوى تعليمي أو توعوي',
      'events': 'مناسبات أو فعاليات',
      'announcement': 'إعلان أو تنبيه',
      'random': 'عشوائي'
    };
    
    const contentCategoryArabic = contentCategoryMap[contentCategory] || contentCategory;

    // Generate base prompt based on brand_type and content_type
    let basePrompt = '';
    
    if (brandType === 'restaurant') {
      if (contentType === 'product') {
        // ✅ Keep existing product prompt logic as-is
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب شبابي وعفوي. المطلوب منك كتابة وصف قصير وجذاب لمنشور يحتوي على صورة منتج غذائي من مطعم سعودي.

    ⬅️ معلومات عن المطعم:
    - اسم العلامة التجارية: ${brandName}
    - مواقع الفروع: ${brandLocationsText}
    - نوع المطعم أو الفئة: ${restaurantCategory}
    - رؤية وقيم المطعم: ${visionAndValues}

    ⬅️ معلومات عن المنتج:
    - اسم المنتج: ${productName}
    - السعر (اختياري): ${price} ريال
    - وصف المنتج: ${description}

    📝 التعليمات:
    - اكتب باللهجة السعودية بأسلوب طبيعي.
    - انتبه من الاخطاء اللغوية والاملائية.
    - ابدأ بجملة تشد الانتباه، تعبر عن الطعم أو التجربة بدون مبالغة أو تكرار.
    - صف المنتج بطريقة شهية ومغرية مع عبارات دارجة.
    - اكتب المحتوى وحاول يكون مناسب مع رؤية وقيم المطعم , بين هذا الشيء بشكل غير مباشر.
    - لا تذكر السعر إلا إذا حسيت إنه محفز (مثلا قيمة المطعم انه يقدم منتجات بأسعار تنافسية).
    -  أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
    - لا تستخدم عبارات غير منطقية أو غير دارجة باللهجة.
    - اختم بنداء خفيف.
    - لا تجعلها طويلة جدا, اجعلها وسط

    🎯 الهدف: نص يحمّس ويشوق القارئ، ويعكس هوية المطعم وقيمة ور، بأسلوب يقربه من الجمهور.`;
      } else if (contentType === 'general') {
        // 🆕 New prompt for general content for restaurant
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب جذاب. هذا المنشور لا يحتوي على منتج بل يعكس أجواء المطعم - مثل: ${contentCategoryArabic}.

⬅️ معلومات عن المطعم:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- نوع المطعم أو الفئة: ${restaurantCategory}
- رؤية وقيم المطعم: ${visionAndValues}

⬅️ وصف المحتوى (اختياري):
${description || 'لا يوجد وصف إضافي'}

📝 التعليمات:
- لا تذكر منتج.
- صف الأجواء بأسلوب شبابي وجذاب.
- اربط المحتوى بهوية ورؤية المطعم بطريقة غير مباشرة.
- لا تجعل النص طويل.
- استخدم عبارات تنقل الإحساس بجو المطعم.
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بدعوة خفيفة للزيارة.

🎯 الهدف: نقل الإحساس بجو المطعم وتحفيز المتابع للزيارة.`;
      }
    } else if (brandType === 'coffee') {
      if (contentType === 'product') {
        // ✅ Existing coffee product prompt
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، وتكتب باللهجة السعودية بأسلوب بسيط وجذّاب. مطلوب منك تكتب وصف قصير وجذّاب لمنشور فيه صورة مشروب أو منتج من مقهى.

⬅️ 
معلومات عن المقهى:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية وقيم العلامة التجارية: ${visionAndValues}

⬅️ 
معلومات عن المنتج:
- اسم المنتج: ${productName}
- السعر (اختياري): ${price} ريال
- وصف المنتج: ${description}

📝 
التعليمات:
- اكتب باللهجة السعودية بأسلوب طبيعي .
- ابدأ بجملة ملفتة (ممكن تكون عن الطعم، الإحساس، أو المزاج) بدون مبالغة أو تكرار.
- صف نكهة أو تجربة المشروب بكلمات بسيطة وأنيقة.
- اربط تجربة المنتج برؤية المقهى بشكل غير مباشر واحترافي.
- لا تذكر السعر إلا إذا كان يضيف قيمة أو يحمّس الزبون.
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بجملة تشجيعية خفيفة.
- لا تجعلها طويلة جدا, اجعلها وسط

🎯 
الهدف: كتابة وصف يشد الانتباه، يعكس أسلوب المقهى، ويشجع على التجربة بطريقة ودودة وشبابية.`;
      } else if (contentType === 'general') {
        // 🆕 New coffee general content prompt
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب جذاب. هذا المنشور يركز على الهدوء والأجواء وتجربة الزبائن في المقهى - مثل: ${contentCategoryArabic}.

⬅️ معلومات عن المقهى:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية وقيم العلامة التجارية: ${visionAndValues}

⬅️ وصف المحتوى (اختياري):
${description || 'لا يوجد وصف إضافي'}

📝 التعليمات:
- لا تذكر منتج محدد.
- صف الأجواء والهدوء والراحة في المقهى.
- اربط المحتوى بتجربة الزبائن ورؤية المقهى بطريقة غير مباشرة.
- استخدم كلمات تنقل الشعور بالراحة والاستمتاع.
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بدعوة خفيفة لتجربة المقهى.
- لا تجعل النص طويل.

🎯 الهدف: نقل الإحساس بأجواء المقهى الهادئة وتحفيز المتابع للزيارة.`;
      }
    } else if (brandType === 'bakery') {
      if (contentType === 'product') {
        // ✅ Existing bakery product prompt
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، وتكتب باللهجة السعودية بأسلوب بسيط وجذّاب. مطلوب منك تكتب وصف قصير وجذّاب لمنشور فيه صورة حلا أو منتج من محل حلويات أو مخبوزات.


معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية العلامة التجارية: ${visionAndValues}

معلومات المنتج:
- اسم المنتج: ${productName}
- السعر: ${price} ريال
- وصف المنتج: ${description}


📝 
التعليمات:
- اكتب باللهجة السعودية بأسلوب طبيعي .
- ابدأ بجملة مغرية تفتح الشهية , بدون مبالغة أو تكرار.
- صف المذاق والمكونات بكلمات تحرك الحواس.
- اربط تجربة المنتج برؤية المحل بشكل غير مباشر واحترافي.
- لا تذكر السعر إلا إذا كان يضيف قيمة أو يحمّس الزبون.
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بجملة تشجيعية خفيفة.
- لا تجعلها طويلة جدا, اجعلها وسط


🎯 
الهدف: نص يشوّق القارئ ويعكس هوية المحل ويحمسه للتجربة.`;
      } else if (contentType === 'general') {
        // 🆕 New bakery general content prompt
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب جذاب. هذا المنشور يصف الرائحة والألوان والديكور في المخبز - مثل: ${contentCategoryArabic}.

⬅️ معلومات عن المخبز:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- رؤية العلامة التجارية: ${visionAndValues}

⬅️ وصف المحتوى (اختياري):
${description || 'لا يوجد وصف إضافي'}

📝 التعليمات:
- لا تذكر منتج محدد.
- صف الرائحة الزكية والألوان الجميلة والأجواء في المخبز.
- اربط المحتوى بتجربة الزبائن ورؤية المخبز بطريقة غير مباشرة.
- استخدم كلمات تحرك الحواس (البصر والشم).
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بدعوة خفيفة لتجربة المخبز.
- لا تجعل النص طويل.

🎯 الهدف: نقل الإحساس بأجواء المخبز الشهية وتحفيز المتابع للزيارة.`;
      }
    } else {
      // brand_type === 'other' or any other value
      const customBrandType = brandData.custom_brand_type;
      
      if (contentType === 'product') {
        // ✅ Existing other brand product prompt
        basePrompt = `أنت كاتب محتوى لمنصة TikTok، وتكتب باللهجة السعودية بأسلوب واضح وجذّاب. مهمتك كتابة وصف قصير ومشوّق لصورة منتج من علامة تجارية تعمل في مجال ${customBrandType}.

⬅️
 معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
نوع العلامة التجارية (المجال) : ${customBrandType}
- رؤية وقيم العلامة التجارية: ${visionAndValues}

⬅️
 معلومات المنتج:
- اسم المنتج: ${productName}
- السعر (اختياري): ${price} ريال
- وصف المنتج: ${description}

📝 
التعليمات:
- اكتب باللهجة السعودية بأسلوب طبيعي
- ابدأ بجملة توضح فائدة المنتج بشكل مباشر ومغري.
- صف المنتج بطريقة مختصرة توضح استخدامه أو تميّزه بلغة سهلة وواضحة.
- اربط تجربة المنتج او الخدمة برؤية المحل بشكل غير مباشر واحترافي.
- لا تذكر السعر إلا إذا كان محفّز للشراء أو التجربة.
- أحيانا اذكر مواقع الفروع او الموقع الالكتروني إن وجد واحيانا لا تذكرها.
- اختم بدعوة خفيفة للتجربة أو التفاعل.
- لا تجعلها طويلة جدا, من جملة الى 4 جمل كأقصى حد.
- لا تجعلها طويلة جدا, اجعلها وسط

🎯 
الهدف: كتابة وصف يعكس فائدة المنتج، ويقنع المتابع بطريقة غير مملة أو رسمية.`;
      } else if (contentType === 'general') {
        // 🆕 New general content prompt for other brand types
        basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب جذاب. هذا المنشور يستخدم storytelling عام حول تجربة العملاء في ${customBrandType} - مثل: ${contentCategoryArabic}.

⬅️ معلومات النشاط التجاري:
- اسم العلامة التجارية: ${brandName}
- مواقع الفروع: ${brandLocationsText}
- نوع العلامة التجارية (المجال): ${customBrandType}
- رؤية وقيم العلامة التجارية: ${visionAndValues}

⬅️ وصف المحتوى (اختياري):
${description || 'لا يوجد وصف إضافي'}

📝 التعليمات:
- لا تذكر منتج محدد.
- اروي قصة بسيطة حول تجربة العملاء أو أجواء المكان.
- اربط المحتوى بهوية ورؤية العلامة التجارية بطريقة غير مباشرة.
- استخدم أسلوب يناسب طبيعة المجال (${customBrandType}).
- أحيانا اذكر الموقع او المواقع واحيانا لا تذكرها.
- اختم بدعوة خفيفة للتجربة أو التفاعل.
- لا تجعل النص طويل.

🎯 الهدف: نقل تجربة إيجابية وتحفيز المتابع للتفاعل مع العلامة التجارية.`;
      }
    }

    console.log('Using base prompt template for brand type:', brandType, 'and content type:', contentType);

    // Generate 3 different captions with variations
    const captionPrompts = [
      basePrompt + '\n\n🎨 أسلوب الكتابة: اكتب بطريقة حماسية ومشوقة.',
      basePrompt + '\n\n🎨 أسلوب الكتابة: اكتب بطريقة هادئة وأنيقة.',
      basePrompt + '\n\n🎨 أسلوب الكتابة: اكتب بطريقة ودودة وقريبة من القلب.'
    ];

    const generatedCaptions = [];

    console.log('Generating 3 different captions...');

    // Generate each caption with different styles
    for (let i = 0; i < 3; i++) {
      console.log(`Generating caption ${i + 1}/3...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a professional social media content creator specializing in TikTok captions for brands in Saudi Arabia. Generate engaging, authentic Arabic captions that reflect the brand identity and appeal to the Saudi audience.' },
            { role: 'user', content: captionPrompts[i] }
          ],
          max_tokens: 300,
          temperature: 0.8 + (i * 0.1), // Slightly different temperature for variety
        }),
      });

      console.log(`OpenAI API response status for caption ${i + 1}:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const caption = data.choices[0].message.content;

      console.log(`Caption ${i + 1} generated successfully`);
      generatedCaptions.push({
        caption: caption,
        style: i === 0 ? 'enthusiastic' : i === 1 ? 'elegant' : 'friendly'
      });
    }

    console.log('All 3 captions generated successfully');

    // Get remaining credits after all operations
    const { data: finalCredits } = await supabase
      .from('profiles')
      .select('caption_credits')
      .eq('id', user.id)
      .single();

    return new Response(JSON.stringify({ 
      captions: generatedCaptions,
      totalCaptions: 3,
      remainingCredits: finalCredits?.caption_credits || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-captions-multiple function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
