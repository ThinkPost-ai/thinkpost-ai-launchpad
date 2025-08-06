import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { processImageForTikTok } from '@/utils/imageProcessing';
import { useLanguage } from '@/contexts/LanguageContext';

interface TikTokSettings {
  privacyLevel: 'public' | 'friends' | 'only_me';
  allowComments: boolean;
  commercialContent: boolean;
  yourBrand: boolean;
  brandedContent: boolean;
}

interface Product {
  id?: string;
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  tiktokEnabled: boolean;
  instagramEnabled: boolean;
  tiktokSettings: TikTokSettings;
  generateCaption: boolean;
  enhanceImage: boolean;
  is_new?: boolean;
}

export const useProductManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();
  
  const [products, setProducts] = useState<Product[]>([
    {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null,
      tiktokEnabled: false,
      instagramEnabled: false,
      generateCaption: true,
      enhanceImage: false,
      tiktokSettings: {
        privacyLevel: 'public',
        allowComments: true,
        commercialContent: false,
        yourBrand: false,
        brandedContent: false
      }
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [tiktokValidationStates, setTiktokValidationStates] = useState<boolean[]>([true]);

  const addProduct = () => {
    setProducts(prev => [...prev, {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null,
      tiktokEnabled: false,
      instagramEnabled: false,
      generateCaption: true,
      enhanceImage: false,
      tiktokSettings: {
        privacyLevel: 'public',
        allowComments: true,
        commercialContent: false,
        yourBrand: false,
        brandedContent: false
      }
    }]);
    // Add validation state for new product
    setTiktokValidationStates(prev => [...prev, true]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index));
      // Remove validation state for removed product
      setTiktokValidationStates(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateProduct = useCallback((index: number, field: keyof Product, value: any) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map((product, i) => {
        if (i === index) {
          return { ...product, [field]: value };
        }
        return product;
      });
      return updatedProducts;
    });
  }, []);

  const updateTikTokSettings = useCallback((index: number, settings: Partial<TikTokSettings>) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map((product, i) => {
        if (i === index) {
          return { 
            ...product, 
            tiktokSettings: { ...product.tiktokSettings, ...settings }
          };
        }
        return product;
      });
      return updatedProducts;
    });
  }, []);

  const handleImageSelect = useCallback(async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if it's a video file - don't process videos, just use them directly
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        // For videos, just create preview and use original file
        const imageUrl = URL.createObjectURL(file);
        setProducts(prevProducts => {
          const updatedProducts = prevProducts.map((product, i) => {
            if (i === index) {
              return { 
                ...product, 
                image: file,
                imagePreview: imageUrl
              };
            }
            return product;
          });
          return updatedProducts;
        });
      } else {
        // For images, process them for TikTok compatibility
        try {
          const processedResult = await processImageForTikTok(file);
          const processedFile = processedResult.file;
          const imageUrl = URL.createObjectURL(processedFile);
          
          setProducts(prevProducts => {
            const updatedProducts = prevProducts.map((product, i) => {
              if (i === index) {
                return { 
                  ...product, 
                  image: processedFile,
                  imagePreview: imageUrl
                };
              }
              return product;
            });
            return updatedProducts;
          });

          // Show processing feedback if image was optimized
          if (processedResult.wasProcessed) {
            const descriptionKey = processedResult.originalSize.width > processedResult.processedSize.width 
              ? 'upload.imageOptimizedAndResized' 
              : 'upload.imageOptimizedDescription';
            
            toast({
              title: t('upload.imageOptimized'),
              description: t(descriptionKey),
              duration: 3000,
            });
          }
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            title: t('upload.processingError'),
            description: "Could not process image. Using original file.",
            variant: "destructive"
          });
          
          // Fall back to original file if processing fails
          const imageUrl = URL.createObjectURL(file);
          setProducts(prevProducts => {
            const updatedProducts = prevProducts.map((product, i) => {
              if (i === index) {
                return { 
                  ...product, 
                  image: file,
                  imagePreview: imageUrl
                };
              }
              return product;
            });
            return updatedProducts;
          });
        }
      }
    }
  }, [toast, t]);

  const removeImage = useCallback((index: number) => {
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map((product, i) => {
        if (i === index) {
          if (product.imagePreview) {
            URL.revokeObjectURL(product.imagePreview);
          }
          return { 
            ...product, 
            image: null,
            imagePreview: null
          };
        }
        return product;
      });
      return updatedProducts;
    });
  }, []);

  const validateProducts = () => {
    const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
    const isInstagramConnected = instagramProfile?.connected || false;
    
    return products.every((product, index) => {
      const hasBasicInfo = product.name.trim() && product.image;
      const hasConnectedPlatform = (product.tiktokEnabled && isTikTokConnected) || 
                                  (product.instagramEnabled && isInstagramConnected);
      const isTikTokValid = tiktokValidationStates[index] !== false;
      
      return hasBasicInfo && hasConnectedPlatform && isTikTokValid;
    });
  };

  const handleTikTokValidationChange = (index: number, isValid: boolean) => {
    setTiktokValidationStates(prev => {
      const newStates = [...prev];
      newStates[index] = isValid;
      return newStates;
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return uploadData.path;
  };

  const saveProductsOnly = async () => {
    if (!user || !validateProducts()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the product name, add an image, connect & enable at least one social media platform for all products, and complete TikTok commercial content settings if applicable",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const savedProducts = [];

      for (const product of products) {
        if (!product.image) continue;

        // Upload image
        const imagePath = await uploadImage(product.image);

        // Save product with TikTok settings
        const { data, error } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: product.name,
            price: parseFloat(product.price) || null,
            description: product.description,
            image_path: imagePath,
            tiktok_enabled: product.tiktokEnabled,
            tiktok_privacy_level: product.tiktokSettings.privacyLevel,
            tiktok_allow_comments: product.tiktokSettings.allowComments,
            tiktok_commercial_content: product.tiktokSettings.commercialContent,
            tiktok_your_brand: product.tiktokSettings.yourBrand,
            tiktok_branded_content: product.tiktokSettings.brandedContent,
            is_new: true
          })
          .select()
          .single();

        if (error) throw error;
        savedProducts.push(data);
      }

      toast({
        title: "Success!",
        description: `${savedProducts.length} product(s) saved successfully`
      });

      // Navigate to review content page
      navigate('/review-content');

      // Reset products to initial state
      setProducts([{
        name: '',
        price: '',
        description: '',
        image: null,
        imagePreview: null,
        tiktokEnabled: false,
        instagramEnabled: false,
        generateCaption: true,
        enhanceImage: false,
        tiktokSettings: {
          privacyLevel: 'public',
          allowComments: true,
          commercialContent: false,
          yourBrand: false,
          brandedContent: false
        }
      }]);

    } catch (error: any) {
      console.error('Error saving products:', error);
      toast({
        title: "Error",
        description: "Failed to save products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProductsWithCaptions = async () => {
    if (!user || !validateProducts()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the product name, add an image, connect & enable at least one social media platform for all products, and complete TikTok commercial content settings if applicable",
        variant: "destructive"
      });
      return;
    }

    // Debug: Check user session before proceeding
    console.log('Current user:', user);
    console.log('User ID:', user.id);
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', sessionError);
    
    if (!session) {
      console.error('No active session found');
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to generate captions. Please sign in again.",
        variant: "destructive"
      });
      return;
    }

    console.log('Session access token available:', !!session.access_token);
    console.log('Session user ID:', session.user?.id);

    setGeneratingCaptions(true);

    try {
      // Test authentication and RLS before proceeding
      console.log('Testing authentication and RLS...');
      
      // Debug auth context using the database function
      const { data: authDebug, error: authDebugError } = await supabase.rpc('debug_auth_context');
      console.log('Auth context debug:', { data: authDebug, error: authDebugError });
      
      // Check if user profile exists (required for RLS)
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      console.log('Profile check result:', { data: profileCheck, error: profileError });
      
      if (profileError || !profileCheck) {
        console.error('User profile missing or inaccessible:', profileError);
        throw new Error(`User profile issue: ${profileError?.message || 'Profile not found'}`);
      }
      
      // First, try to query existing products to test RLS
      const { data: testQuery, error: testError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      console.log('Test query result:', { data: testQuery, error: testError });
      
      if (testError) {
        console.error('Test query failed:', testError);
        throw new Error(`Authentication test failed: ${testError.message}`);
      }
      
      console.log('Authentication test passed, proceeding with product creation...');

      const productPromises = products.map(async (product) => {
        const imagePath = await uploadImage(product.image!);

        const productData = {
          user_id: user.id,
          name: product.name,
          price: product.price ? parseFloat(product.price) : null,
          description: product.description || null,
          image_path: imagePath,
          caption: null,
          is_new: true, // Mark new products
          // Add TikTok settings like in saveProductsOnly
          tiktok_enabled: product.tiktokEnabled,
          tiktok_privacy_level: product.tiktokSettings.privacyLevel,
          tiktok_allow_comments: product.tiktokSettings.allowComments,
          tiktok_commercial_content: product.tiktokSettings.commercialContent,
          tiktok_your_brand: product.tiktokSettings.yourBrand,
          tiktok_branded_content: product.tiktokSettings.brandedContent
        };

        console.log('Inserting product data:', productData);
        console.log('Current auth state:', {
          userId: user.id,
          sessionUserId: session.user?.id,
          authUid: session.user?.id,
          match: user.id === session.user?.id
        });

        const { data: insertedProduct, error: dbError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (dbError) {
          console.error('Database error inserting product:', dbError);
          console.error('Product data that failed:', productData);
          console.error('Current user:', user);
          console.error('Session user:', session.user);
          throw dbError;
        }

        return insertedProduct;
      });

      const savedProducts = await Promise.all(productPromises);

      const captionPromises = savedProducts.map(async (product, index) => {
        // Check if caption generation is enabled for this product
        const shouldGenerateCaption = products[index].generateCaption;
        
        if (!shouldGenerateCaption) {
          console.log(`Skipping caption generation for product: ${product.name} (generateCaption is OFF)`);
          return product;
        }

        try {
          console.log(`Generating caption for product: ${product.name}`, {
            productId: product.id,
            productName: product.name,
            price: product.price,
            description: product.description
          });

          const { data: captionData, error: captionError } = await supabase.functions.invoke('generate-caption', {
            body: {
              productName: product.name,
              price: product.price,
              description: product.description,
              contentType: 'product',
              contentCategory: null
            }
          });

          console.log(`Caption generation response for ${product.name}:`, {
            data: captionData,
            error: captionError
          });

          if (captionError) {
            console.error('Caption generation error:', captionError);
            
            // Show specific error message to user
            toast({
              title: "Caption Generation Failed",
              description: captionError.message || "Failed to generate caption for " + product.name,
              variant: "destructive"
            });

            if (captionError.message?.includes('Insufficient caption credits') || captionError.message?.includes('402')) {
              toast({
                title: "Caption Credits Exhausted",
                description: "You have reached your monthly caption limit. Products saved without captions.",
                variant: "destructive"
              });
            }
            return product;
          }

          const caption = captionData?.caption;

          if (!caption) {
            console.error('No caption received for product:', product.name);
            toast({
              title: "Caption Generation Failed",
              description: `No caption generated for ${product.name}`,
              variant: "destructive"
            });
            return product;
          }

          console.log(`Generated caption for ${product.name}:`, caption);

          const { error: updateError } = await supabase
            .from('products')
            .update({ caption })
            .eq('id', product.id);

          if (updateError) {
            console.error('Caption update error:', updateError);
            toast({
              title: "Database Update Failed",
              description: `Failed to save caption for ${product.name}`,
              variant: "destructive"
            });
          }

          return { ...product, caption };
        } catch (error) {
          console.error('Failed to generate caption for product:', product.name, error);
          toast({
            title: "Error",
            description: `Error processing ${product.name}: ${error.message}`,
            variant: "destructive"
          });
          return product;
        }
      });

      const processedProducts = await Promise.all(captionPromises);
      
      // Count products with captions generated
      const productsWithCaptions = processedProducts.filter(product => product.caption).length;
      const productsEnabled = products.filter(product => product.generateCaption).length;

      // Start image enhancement for products with enhanceImage enabled
      const enhancementCount = products.filter(product => product.enhanceImage).length;
      
      if (enhancementCount > 0) {
        console.log(`${enhancementCount} products marked for enhancement`);
        
        // Store enhancement intent in localStorage for UI tracking
        const enhancingProducts = savedProducts
          .filter((_, index) => products[index].enhanceImage)
          .map(product => product.id);
        
        if (enhancingProducts.length > 0) {
          const existingEnhancing = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
          const allEnhancing = [...existingEnhancing, ...enhancingProducts];
          localStorage.setItem('enhancingProducts', JSON.stringify(allEnhancing));
          console.log('Stored enhancing products in localStorage:', enhancingProducts);
        }

        // Try to process enhancement - gracefully handle missing columns
        const enhancementPromises = savedProducts.map(async (product, index) => {
          if (!products[index].enhanceImage) {
            return;
          }

          try {
            console.log(`Starting image enhancement for product: ${product.name}`);
            
            const imageUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${product.image_path}`;
            
            // Try to update product status to processing (gracefully handle missing columns)
            try {
              await supabase
                .from('products')
                .update({ 
                  image_enhancement_status: 'processing',
                  enhanced_image_path: null 
                } as any)
                .eq('id', product.id);
              console.log(`Updated status to processing for ${product.name}`);
            } catch (updateError: any) {
              if (updateError.message?.includes('enhanced_image_path') || updateError.message?.includes('image_enhancement_status')) {
                console.log(`Enhancement columns not available yet for ${product.name} - processing anyway`);
              } else {
                throw updateError;
              }
            }
            
            // Call image enhancement function
            supabase.functions.invoke('enhance-image', {
              body: {
                productId: product.id,
                imageUrl: imageUrl,
                productName: product.name,
                brandName: null
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error(`Image enhancement failed for ${product.name}:`, error);
              } else {
                console.log(`Image enhancement started for ${product.name}`);
              }
            });
          } catch (error) {
            console.error(`Failed to start image enhancement for ${product.name}:`, error);
          }
        });
        
        // Don't wait for enhancement promises to complete
        Promise.all(enhancementPromises).catch(error => {
          console.log('Some enhancements may have failed:', error);
        });
      }

      // Don't wait for image enhancement - let it process in background
      // Promise.all(enhancementPromises); // Commented out until migration is applied

      toast({
        title: t('toast.success'),
        description: enhancementCount > 0 
          ? `${products.length} products saved, ${productsWithCaptions} captions generated, ${enhancementCount} images enhancing...`
          : productsWithCaptions > 0 
            ? `${products.length} products saved, ${productsWithCaptions} captions generated`
            : `${products.length} products saved`
      });

      // Redirect to review content page
      navigate('/review-content');
    } catch (error: any) {
      console.error('Save with captions error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save products with captions",
        variant: "destructive"
      });
    } finally {
      setGeneratingCaptions(false);
    }
  };

  return {
    products,
    saving,
    generatingCaptions,
    addProduct,
    removeProduct,
    updateProduct,
    updateTikTokSettings,
    handleImageSelect,
    removeImage,
    validateProducts,
    handleTikTokValidationChange,
    saveProductsOnly,
    saveProductsWithCaptions
  };
};
