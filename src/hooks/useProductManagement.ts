
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id?: string;
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

export const useProductManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([
    {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  const addProduct = () => {
    setProducts(prevProducts => [...prevProducts, {
      name: '',
      price: '',
      description: '',
      image: null,
      imagePreview: null
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prevProducts => prevProducts.filter((_, i) => i !== index));
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
    return products.every(product => 
      product.name.trim() && 
      product.image
    );
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
        description: "Please fill in the product name and add an image for all products",
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
        description: "Please fill in the product name and add an image for all products",
        variant: "destructive"
      });
      return;
    }

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

      const savedProducts = await Promise.all(productPromises);

      const captionPromises = savedProducts.map(async (product) => {
        try {
          const { data: captionData, error: captionError } = await supabase.functions.invoke('generate-caption', {
            body: {
              productName: product.name,
              price: product.price,
              description: product.description
            }
          });

          if (captionError) {
            console.error('Caption generation error:', captionError);
            if (captionError.message?.includes('Insufficient caption credits')) {
              toast({
                title: "Caption Credits Exhausted",
                description: "You have reached your monthly caption limit. Products saved without captions.",
                variant: "destructive"
              });
            }
            return product;
          }

          const caption = captionData?.caption;

          if (caption) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ caption })
              .eq('id', product.id);

            if (updateError) {
              console.error('Caption update error:', updateError);
            }

            // Schedule the post with the generated caption
            const scheduledDate = new Date();
            scheduledDate.setHours(scheduledDate.getHours() + 24); // Schedule for 24 hours from now

            const { error: scheduleError } = await supabase
              .from('scheduled_posts')
              .insert({
                user_id: user.id,
                product_id: product.id,
                caption: caption,
                platform: 'instagram', // Default platform
                scheduled_date: scheduledDate.toISOString(),
                status: 'scheduled'
              });

            if (scheduleError) {
              console.error('Schedule error:', scheduleError);
            }
          }

          return { ...product, caption };
        } catch (error) {
          console.error('Failed to generate caption for product:', product.name, error);
          return product;
        }
      });

      await Promise.all(captionPromises);

      toast({
        title: "Success!",
        description: `${products.length} product(s) saved, captions generated, and posts scheduled successfully`
      });

      // Redirect to Schedule tab in user dashboard
      navigate('/user-dashboard?tab=schedule');
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
    saveProductsOnly,
    saveProductsWithCaptions
  };
};
