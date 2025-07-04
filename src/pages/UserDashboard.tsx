import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OverviewCards from '@/components/dashboard/OverviewCards';
import MediaManagement from '@/components/dashboard/MediaManagement';
import GeneratedCaptions from '@/components/dashboard/GeneratedCaptions';
import ScheduledPosts from '@/components/dashboard/ScheduledPosts';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import QuickActions from '@/components/dashboard/QuickActions';
import TikTokConnection from '@/components/dashboard/TikTokConnection';
import InstagramConnection from '@/components/dashboard/InstagramConnection';

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [checkingRestaurant, setCheckingRestaurant] = useState(true);

  // Use custom hooks for data management
  const { restaurant, stats, isLoading, handleCreditsUpdate } = useDashboardData();

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
        navigate('/restaurant-setup');
        return;
      }

      if (!data) {
        console.log('No restaurant found, redirecting to setup');
        navigate('/restaurant-setup');
        return;
      }

      setCheckingRestaurant(false);
    } catch (error) {
      console.error('Error in checkRestaurantExists:', error);
      navigate('/restaurant-setup');
    }
  };

  // Handle tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'media', 'captions', 'schedule', 'notifications'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (loading || isLoading || checkingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <DashboardHeader restaurant={restaurant} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <TabsList className="grid w-max min-w-full grid-cols-5 h-11 sm:h-10 mx-3 sm:mx-0 sm:w-full lg:w-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                {t('dashboard.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                {t('dashboard.tabs.media')}
              </TabsTrigger>
              <TabsTrigger value="captions" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                {t('dashboard.tabs.captions')}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                {t('dashboard.tabs.schedule')}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                {t('dashboard.tabs.notifications')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Quick Actions - positioned below tabs and above content */}
          <QuickActions 
            onCaptionsClick={() => setActiveTab('captions')}
            onScheduleClick={() => setActiveTab('schedule')}
          />

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <OverviewCards stats={stats} />
            
            {/* Social Media Connections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <TikTokConnection />
              <InstagramConnection />
            </div>
          </TabsContent>

          <TabsContent value="media">
            <MediaManagement />
          </TabsContent>

          <TabsContent value="captions">
            <GeneratedCaptions onCreditsUpdate={handleCreditsUpdate} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduledPosts />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
