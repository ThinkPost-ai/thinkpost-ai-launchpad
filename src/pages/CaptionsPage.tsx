import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GeneratedCaptions from '@/components/dashboard/GeneratedCaptions';
import { supabase } from '@/integrations/supabase/client';

const CaptionsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingRestaurant, setCheckingRestaurant] = useState(true);
  const { restaurant, isLoading, handleCreditsUpdate } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user && !loading) {
      checkRestaurantExists();
    }
  }, [user, loading, navigate]);

  const checkRestaurantExists = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking restaurant:', error);
        navigate('/brand-setup');
        return;
      }

      if (!data) {
        console.log('No restaurant found, redirecting to setup');
        navigate('/brand-setup');
        return;
      }

      setCheckingRestaurant(false);
    } catch (error) {
      console.error('Error in checkRestaurantExists:', error);
      navigate('/brand-setup');
    }
  };

  if (loading || isLoading || checkingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  // Additional check: if restaurant data is still null after loading, redirect to setup
  if (!restaurant) {
    navigate('/brand-setup');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <DashboardHeader restaurant={restaurant} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="flex items-center gap-2 text-deep-blue dark:text-white hover:bg-deep-blue/10 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Generated Captions Content */}
        <GeneratedCaptions onCreditsUpdate={handleCreditsUpdate} />
      </div>
    </div>
  );
};

export default CaptionsPage; 