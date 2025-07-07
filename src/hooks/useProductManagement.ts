import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';

interface Product {
  id?: string;
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  tiktokEnabled: boolean;
  instagramEnabled: boolean;
  is_new?: boolean;
}

export const useProductManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      instagramEnabled: false
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
      instagramEnabled: false
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

  const handleImageSelect = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
  }, []);

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
      const productPromises = products.map(async (product) => {
        const imagePath = await uploadImage(product.image!);

        const productData = {
          user_id: user.id,
          name: product.name,
          price: product.price ? parseFloat(product.price) : null,
          description: product.description || null,
          image_path: imagePath,
          caption: null
        };

        const { data: insertedProduct, error: dbError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (dbError) throw dbError;

        return insertedProduct;
      });

      await Promise.all(productPromises);

      toast({
        title: "Success!",
        description: `${products.length} product(s) saved successfully`
      });

      // Redirect to Media tab in user dashboard
      navigate('/user-dashboard?tab=media');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save products",
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
      const productPromises = products.map(async (product) => {
        const imagePath = await uploadImage(product.image!);

        const productData = {
          user_id: user.id,
          name: product.name,
          price: product.price ? parseFloat(product.price) : null,
          description: product.description || null,
          image_path: imagePath,
          caption: null,
          is_new: true // Mark new products
        };

        const { data: insertedProduct, error: dbError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (dbError) throw dbError;

        return insertedProduct;
      });

      const savedProducts = await Promise.all(productPromises);

      const captionPromises = savedProducts.map(async (product) => {
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
              description: product.description
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

      await Promise.all(captionPromises);

      toast({
        title: "Success!",
        description: `${products.length} product(s) saved and captions generated successfully`
      });

      // Redirect to captions page
      navigate('/captions');
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
    handleImageSelect,
    removeImage,
    validateProducts,
    handleTikTokValidationChange,
    saveProductsOnly,
    saveProductsWithCaptions
  };
};
