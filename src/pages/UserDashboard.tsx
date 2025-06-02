
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import OverviewCards from '@/components/dashboard/OverviewCards';
import MediaManagement from '@/components/dashboard/MediaManagement';
import GeneratedCaptions from '@/components/dashboard/GeneratedCaptions';
import ScheduledPosts from '@/components/dashboard/ScheduledPosts';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import TikTokConnection from '@/components/dashboard/TikTokConnection';
import QuickActions from '@/components/dashboard/QuickActions';

const UserDashboard = () => {
  const { user, loading, hasRestaurant } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hooks for data management
  const { restaurant, stats, isLoading, handleCreditsUpdate } = useDashboardData();
  useTikTokConnection();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (!loading && !hasRestaurant) {
      navigate('/restaurant-setup');
      return;
    }
  }, [user, loading, hasRestaurant, navigate]);

  // Handle tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'media', 'captions', 'schedule', 'notifications'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <DashboardHeader restaurant={restaurant} />

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="captions">Captions</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewCards stats={stats} />
            
            {/* Social Media Connections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TikTokConnection />
              {/* Future social media connections can be added here */}
            </div>
            
            <QuickActions 
              onCaptionsClick={() => setActiveTab('captions')}
              onScheduleClick={() => setActiveTab('schedule')}
            />
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
