import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    console.log('Dashboard useEffect triggered', { user: user?.id, loading, checking });
    
    if (!loading && !user) {
      console.log('No user found, redirecting to home');
      navigate('/');
      return;
    }

    if (user && !loading) {
      console.log('User exists, checking restaurant status');
      checkRestaurantStatus();
    }
  }, [user, loading, navigate]);

  const checkRestaurantStatus = async () => {
    try {
      console.log('Checking restaurant status for user:', user?.id);
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking restaurant:', error);
        setChecking(false);
        navigate('/restaurant-setup');
        return;
      }

      console.log('Restaurant data found:', data);
      
      if (data) {
        console.log('Restaurant exists, redirecting to user dashboard');
        setChecking(false);
        navigate('/user-dashboard', { replace: true });
      } else {
        console.log('No restaurant found, redirecting to restaurant setup');
        setChecking(false);
        navigate('/restaurant-setup');
      }
    } catch (error) {
      console.error('Error in checkRestaurantStatus:', error);
      setChecking(false);
      navigate('/restaurant-setup');
    }
  };

  // Show loading state while checking
  if (loading || checking) {
    console.log('Showing loading state', { loading, checking });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // This component serves as a redirect component - should not reach here
  return null;
};

export default Dashboard;
