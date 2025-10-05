import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CaptionData } from './types';

export const useCaptionData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);

  const fetchUserCredits = async () => {
    try {
      const { data: totalCredits, error: creditsError } = await supabase.rpc('get_total_credits');

      if (creditsError) {
        console.error('Credits fetch error:', creditsError);
        return;
      }

      setUserCredits(totalCredits || 0);
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  const fetchCaptions = async () => {
    try {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedImages: CaptionData[] = (images || []).map(image => ({
        id: image.id,
        image_path: image.image_path,
        enhanced_image_path: image.enhanced_image_path,
        image_enhancement_status: image.image_enhancement_status,
        original_filename: image.original_filename,
        caption: image.caption,
        created_at: image.created_at,
        status: 'draft' as const,
        type: 'image' as const,
        is_new: image.is_new,
        content_type: image.content_type,
        media_type: image.media_type,
        social_stats: {
          instagram_views: Math.floor(Math.random() * 1000) + 100,
          instagram_likes: Math.floor(Math.random() * 100) + 10,
          tiktok_views: Math.floor(Math.random() * 5000) + 500,
          tiktok_likes: Math.floor(Math.random() * 500) + 50,
        }
      }));

      const transformedProducts: CaptionData[] = (products || []).map(product => ({
        id: product.id,
        image_path: product.image_path,
        enhanced_image_path: product.enhanced_image_path,
        image_enhancement_status: product.image_enhancement_status,
        name: product.name,
        price: product.price,
        description: product.description,
        caption: product.caption,
        created_at: product.created_at,
        status: 'draft' as const,
        type: 'product' as const,
        is_new: product.is_new,
        social_stats: {
          instagram_views: Math.floor(Math.random() * 1000) + 100,
          instagram_likes: Math.floor(Math.random() * 100) + 10,
          tiktok_views: Math.floor(Math.random() * 5000) + 500,
          tiktok_likes: Math.floor(Math.random() * 500) + 50,
        }
      }));

      // Get loading placeholders from localStorage
      let loadingPlaceholders = JSON.parse(localStorage.getItem('loadingPlaceholders') || '[]');
      
      // Remove loading placeholders that have corresponding real products
      const realProductNames = transformedProducts.map(p => p.name);
      const initialPlaceholderCount = loadingPlaceholders.length;

      loadingPlaceholders = loadingPlaceholders.filter((placeholder: any) => {
        // Check if there's a real product with the same name
        const hasRealProduct = realProductNames.some(realName => realName === placeholder.name);
        return !hasRealProduct;
      });

      // Update localStorage if placeholders were removed
      if (loadingPlaceholders.length !== initialPlaceholderCount) {
        localStorage.setItem('loadingPlaceholders', JSON.stringify(loadingPlaceholders));
        console.log(`🗑️ Removed ${initialPlaceholderCount - loadingPlaceholders.length} resolved loading placeholders`);
      }
      
      const allCaptions = [...transformedImages, ...transformedProducts, ...loadingPlaceholders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCaptions(allCaptions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load captions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markNewProductsAsViewed = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_new: false })
        .eq('user_id', user?.id)
        .eq('is_new', true);

      if (error) {
        console.error('Error marking products as viewed:', error);
      }
    } catch (error) {
      console.error('Failed to mark products as viewed:', error);
    }
  };

  useEffect(() => {
    fetchCaptions();
    fetchUserCredits();
  }, [user]);

  // Poll for updates to loading placeholders and new products
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchCaptions();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [user]);

  return {
    captions,
    setCaptions,
    loading,
    userCredits,
    setUserCredits,
    fetchCaptions,
    fetchUserCredits
  };
};
