
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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('caption_credits')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user credits:', error);
        return;
      }

      setUserCredits(profileData?.caption_credits || 0);
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
        .not('caption', 'is', null)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

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
