
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  vision?: string;
}

interface DashboardStats {
  totalPosts: number;
  upcomingPosts: number;
  captionCredits: number;
  captionQuotaTotal: number;
  totalImages: number;
  totalProducts: number;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    upcomingPosts: 0,
    captionCredits: 15,
    captionQuotaTotal: 15,
    totalImages: 0,
    totalProducts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      setRestaurant(restaurantData);

      // Fetch user profile with caption credits
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('caption_credits')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Don't throw error here, just log it since the user might not have a profile yet
      }

      // Fetch images count
      const { count: imagesCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setStats(prev => ({
        ...prev,
        captionCredits: profileData?.caption_credits || 0,
        totalImages: imagesCount || 0,
        totalProducts: productsCount || 0
      }));

    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditsUpdate = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('caption_credits')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Credits update fetch error:', profileError);
        return;
      }

      const newCredits = profileData?.caption_credits || 0;
      setStats(prev => ({
        ...prev,
        captionCredits: newCredits
      }));

      // Show message when credits reach 0
      if (newCredits === 0) {
        toast({
          title: "No Remaining Credits",
          description: "You have 0 caption credits remaining. You've reached your monthly limit.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to update credits:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return {
    restaurant,
    stats,
    isLoading,
    handleCreditsUpdate
  };
};
