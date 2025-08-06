
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: RestaurantCategory;
  vision?: string;
  brand_type?: string;
  custom_brand_type?: string;
  custom_category?: string;
  additional_locations?: string[];
  custom_location?: string;
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
    captionCredits: 0,
    captionQuotaTotal: 0,
    totalImages: 0,
    totalProducts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching dashboard data for user:', user.id);
      
      // Fetch restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (restaurantError) {
        console.error('Restaurant fetch error:', restaurantError);
      } else {
        console.log('Restaurant data fetched:', restaurantData);
        setRestaurant(restaurantData);
      }

      // Use the new get_total_credits function for consistency with backend
      const { data: totalCredits, error: creditsError } = await supabase.rpc('get_total_credits');

      if (creditsError) {
        console.error('Credits fetch error:', creditsError);
      } else {
        console.log('Credits data fetched:', totalCredits);
      }

      // Fetch images count
      const { count: imagesCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats(prev => ({
        ...prev,
        captionCredits: totalCredits || 0,
        captionQuotaTotal: 30,
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
    if (!user?.id) return;
    
    try {
      // Use the new get_total_credits function for consistency with backend
      const { data: totalCredits, error: creditsError } = await supabase.rpc('get_total_credits');

      if (creditsError) {
        console.error('Credits update fetch error:', creditsError);
        return;
      }

      setStats(prev => ({
        ...prev,
        captionCredits: totalCredits || 0
      }));

      // Show message when credits reach 0
      if ((totalCredits || 0) === 0) {
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
