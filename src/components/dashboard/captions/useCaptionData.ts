import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CaptionData } from './types';

export const useCaptionData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number>(0);

  const fetchUserCredits = async () => {
    try {
      // Use the new get_total_credits function for consistency with backend
      const { data: totalCredits, error } = await supabase.rpc('get_total_credits', {
        user_id: user?.id
      });

      if (error) {
        console.error('Error fetching user credits:', error);
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

      // Mark new products as viewed
      await markNewProductsAsViewed();

      // Fetch scheduled posts to determine real status
      const { data: scheduledPosts, error: postsError } = await supabase
        .from('scheduled_posts')
        .select('product_id, status, scheduled_date')
        .eq('user_id', user?.id);

      if (postsError) {
        console.error('Error fetching scheduled posts:', postsError);
      }

      // Create a map of product/image IDs to their scheduled post status
      const statusMap = new Map();
      if (scheduledPosts) {
        scheduledPosts.forEach(post => {
          if (post.product_id) {
            statusMap.set(post.product_id, {
              status: post.status,
              scheduled_date: post.scheduled_date
            });
          }
        });
      }

      const transformedImages = (images || []).map(image => {
        // For images, default to draft since they're not typically scheduled automatically
        const status: 'draft' | 'scheduled' | 'posted' = 'draft';

        return {
          id: image.id,
          image_path: image.file_path,
          original_filename: image.original_filename,
          caption: image.caption,
          description: image.description,
          content_type: image.content_type,
          media_type: image.media_type,
          created_at: image.created_at,
          status,
          type: 'image' as const,
          social_stats: {
            instagram_views: Math.floor(Math.random() * 1000) + 100,
            instagram_likes: Math.floor(Math.random() * 100) + 10,
            tiktok_views: Math.floor(Math.random() * 5000) + 500,
            tiktok_likes: Math.floor(Math.random() * 500) + 50,
          }
        };
      });

      const transformedProducts = (products || []).map(product => {
        // Determine real status based on scheduled posts
        let status: 'draft' | 'scheduled' | 'posted' = 'draft';
        
        const postInfo = statusMap.get(product.id);
        if (postInfo) {
          if (postInfo.status === 'posted') {
            status = 'posted';
          } else if (postInfo.status === 'scheduled' && postInfo.scheduled_date) {
            const scheduledDate = new Date(postInfo.scheduled_date);
            const now = new Date();
            if (scheduledDate > now) {
              status = 'scheduled';
            } else {
              status = 'posted'; // Past scheduled date means it should be posted
            }
          }
        } else if (product.caption) {
          // If product has caption but no scheduled post, it's a draft
          status = 'draft';
        }

        return {
          id: product.id,
          image_path: product.image_path,
          name: product.name,
          price: product.price,
          description: product.description,
          caption: product.caption,
          created_at: product.created_at,
          status,
          type: 'product' as const,
          is_new: product.is_new || false,
          social_stats: {
            instagram_views: Math.floor(Math.random() * 1000) + 100,
            instagram_likes: Math.floor(Math.random() * 100) + 10,
            tiktok_views: Math.floor(Math.random() * 5000) + 500,
            tiktok_likes: Math.floor(Math.random() * 500) + 50,
          }
        };
      });

      const allCaptions = [...transformedImages, ...transformedProducts].sort(
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
