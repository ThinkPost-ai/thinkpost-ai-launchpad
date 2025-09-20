import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Compress image using TinyPNG API
 * Takes base64 image data and returns compressed base64 data
 */
async function compressImageWithTinyPNG(base64Data: string, apiKey: string): Promise<string> {
  try {
    console.log('🔧 Compressing image with TinyPNG...');
    
    // Convert base64 to binary for TinyPNG API
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Step 1: Upload image to TinyPNG for compression
    const response = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: imageBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TinyPNG compression failed:', errorText);
      throw new Error(`TinyPNG compression failed: ${response.status} - ${errorText}`);
    }

    // Get the location URL from the response headers
    const locationUrl = response.headers.get('Location');
    if (!locationUrl) {
      throw new Error('No location URL returned from TinyPNG');
    }

    console.log('📍 TinyPNG compression successful, downloading from:', locationUrl);

    // Step 2: Download the compressed image
    const compressedResponse = await fetch(locationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      },
    });

    if (!compressedResponse.ok) {
      throw new Error(`Failed to download compressed image from TinyPNG: ${compressedResponse.status}`);
    }
    
    const compressedBuffer = await compressedResponse.arrayBuffer();
    const compressedUint8Array = new Uint8Array(compressedBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 1024;
    for (let i = 0; i < compressedUint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(...compressedUint8Array.slice(i, i + chunkSize));
    }
    const compressedBase64 = btoa(binary);
    
    console.log(`✅ TinyPNG compression successful. Size reduced from ${Math.round(base64Data.length * 0.75 / 1024)}KB to ${Math.round(compressedBuffer.byteLength / 1024)}KB`);
    
    return compressedBase64;
  } catch (error) {
    console.error('TinyPNG compression error:', error);
    // Return original image if compression fails
    console.warn('⚠️ Returning original image due to TinyPNG compression failure');
    return base64Data;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const requestBody = await req.json();
    const { productId, imageUrl, productName, brandName, price, description, contentType, contentCategory } = requestBody;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const userId = user.id;

    console.log('🚀 Starting multiple posts creation flow for product:', productId);

    // Get required API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const tinypngApiKey = Deno.env.get('TINYPNG_API_KEY');
    
    if (!openaiApiKey || !tinypngApiKey) {
      throw new Error('Missing required API keys');
    }

    // Step 1: Generate 3 enhanced images directly
    console.log('📸 Step 1: Generating 3 enhanced images...');
    
    // Fetch original image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 1024;
    for(let i = 0; i < uint8Array.length; i += chunkSize){
      binary += String.fromCharCode(...uint8Array.slice(i, i + chunkSize));
    }
    const base64Image = btoa(binary);
    
    // Prepare image data for the new API
    const imageBase64 = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('🚀 Calling new image generator API for 3 images...');
    
    // Call the new Vercel API to generate 3 enhanced images
    const enhancementResponse = await fetch('https://python-hello-world-swart-five.vercel.app/api/image_generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        number_of_images: 3
      })
    });

    if (!enhancementResponse.ok) {
      const errorText = await enhancementResponse.text();
      console.error('Image generator API error:', errorText);
      throw new Error(`Image generator API error: ${enhancementResponse.status} - ${errorText}`);
    }

    const enhancementData = await enhancementResponse.json();
    console.log('✅ Received 3 enhanced images from API');

    if (!enhancementData.success || !enhancementData.generated_images || enhancementData.generated_images.length !== 3) {
      throw new Error('Invalid response from image generator API');
    }

    const generatedImages = enhancementData.generated_images;
    const enhancedImageResults = [];

    // Process each of the 3 generated images
    for (let i = 0; i < generatedImages.length; i++) {
      const generatedImage = generatedImages[i];
      console.log(`📸 Processing image ${i + 1}/3...`);
      
      // Extract base64 from data URL
      const base64Data = generatedImage.image.split(',')[1];
      
      // Compress the enhanced image with TinyPNG
      console.log(`🖼️ Starting TinyPNG compression for image ${i + 1}...`);
      const compressedImageBase64 = await compressImageWithTinyPNG(base64Data, tinypngApiKey);
      
      // Convert compressed base64 to buffer for storage
      const processedImageBuffer = Uint8Array.from(atob(compressedImageBase64), (c) => c.charCodeAt(0));
      console.log(`📦 Final compressed image ${i + 1} size: ${Math.round(processedImageBuffer.length / 1024)}KB`);
      
      const enhancedFileName = `enhanced-multiple-${productId}-${Date.now()}-${i + 1}.jpg`;
      console.log(`💾 Uploading enhanced image ${i + 1} as: ${enhancedFileName}`);
      
      const { error: uploadError } = await supabase.storage.from("restaurant-images").upload(enhancedFileName, processedImageBuffer, {
        contentType: "image/jpeg",
        upsert: false
      });
      
      if (uploadError) {
        console.error(`Upload failed for image ${i + 1}:`, uploadError);
        throw new Error(`Failed to upload enhanced image ${i + 1}`);
      }
      
      const enhancedImageUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${enhancedFileName}`;
      console.log(`✅ Enhanced image ${i + 1} uploaded successfully: ${enhancedImageUrl}`);
      
      enhancedImageResults.push({
        imageUrl: enhancedImageUrl,
        imagePath: enhancedFileName,
        prompt: generatedImage.prompt
      });
    }

    console.log(`🎉 All 3 images enhanced successfully for product ${productId}`);

    // Step 2: Generate 3 different captions directly
    console.log('📝 Step 2: Generating 3 different captions...');
    
    // Get brand information for the user
    console.log('Fetching brand information for user:', userId);
    const { data: brandData, error: brandError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (brandError) {
      console.error('Error fetching brand data:', brandError);
      throw new Error('Failed to fetch brand information');
    }

    if (!brandData) {
      console.error('No brand data found for user:', userId);
      throw new Error('Brand information not found. Please complete your brand setup first.');
    }

    console.log('Brand data retrieved:', brandData);

    // Prepare brand information for the prompt
    const brandNameFromData = brandData.name;
    const brandType = brandData.brand_type || 'other';
    const visionAndValues = brandData.vision || 'تقديم أفضل تجربة للعملاء';
    
    // Handle locations
    let brandLocations = [brandData.location];
    if (brandData.additional_locations && brandData.additional_locations.length > 0) {
      brandLocations = brandLocations.concat(brandData.additional_locations);
    }
    
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

    // Generate base prompt
    const basePrompt = `أنت كاتب محتوى محترف لمنصة TikTok، تكتب باللهجة السعودية بأسلوب شبابي وعفوي. اكتب وصف قصير وجذاب لمنشور يحتوي على صورة منتج غذائي.

معلومات المطعم: ${brandNameFromData} في ${brandLocationsText}
معلومات المنتج: ${productName} - ${description}

اكتب باللهجة السعودية بأسلوب طبيعي وجذاب.`;

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
          'Authorization': `Bearer ${openaiApiKey}`,
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

    // Step 3: Get the original product data
    console.log('📋 Step 3: Getting original product data...');
    const { data: originalProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !originalProduct) {
      throw new Error('Failed to get original product data');
    }

    // Step 4: Create 3 new product records (one for each enhanced image + caption combination)
    console.log('🔄 Step 4: Creating 3 new product records...');
    const newProducts = [];

    for (let i = 0; i < 3; i++) {
      const enhancedImage = enhancedImageResults[i];
      const captionData = generatedCaptions[i];
      
      const newProductData = {
        user_id: userId,
        name: `${originalProduct.name} - Version ${i + 1}`,
        price: originalProduct.price,
        description: originalProduct.description,
        image_path: enhancedImage.imagePath,
        enhanced_image_path: enhancedImage.imagePath,
        image_enhancement_status: 'completed',
        caption: captionData.caption,
        is_new: true,
        selected_version: 'enhanced'
      };

      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert(newProductData)
        .select()
        .single();

      if (createError) {
        console.error(`Failed to create product ${i + 1}:`, createError);
        throw new Error(`Failed to create product ${i + 1}: ${createError.message}`);
      }

      newProducts.push({
        ...newProduct,
        enhancedImageUrl: enhancedImage.imageUrl,
        captionStyle: captionData.style
      });

      console.log(`✅ Created product ${i + 1}/3: ${newProduct.id}`);
    }

    // Step 5: Update the original product to mark it as processed
    console.log('📝 Step 5: Updating original product status...');
    await supabase
      .from('products')
      .update({ 
        image_enhancement_status: 'completed_multiple',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    console.log('🎉 Multiple posts creation completed successfully!');

    return new Response(JSON.stringify({
      success: true,
      originalProductId: productId,
      newProducts: newProducts,
      totalProducts: 3,
      enhancedImages: enhancedImageResults,
      captions: generatedCaptions,
      message: '3 posts created successfully for review'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    
  } catch (error) {
    console.error("Multiple posts creation failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
