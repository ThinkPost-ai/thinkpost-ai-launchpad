import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Bell, 
  Camera, 
  Calendar as CalendarIcon, 
  Image as ImageIcon, 
  MessageSquare, 
  TrendingUp, 
  Upload, 
  Edit, 
  Play,
  Grid3X3,
  List,
  Filter,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserProfilePanel from '@/components/dashboard/UserProfilePanel';
import OverviewCards from '@/components/dashboard/OverviewCards';
import MediaManagement from '@/components/dashboard/MediaManagement';
import GeneratedCaptions from '@/components/dashboard/GeneratedCaptions';
import ScheduledPosts from '@/components/dashboard/ScheduledPosts';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';

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

const UserDashboard = () => {
  const { user, loading, hasRestaurant } = useAuth();
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (!loading && !hasRestaurant) {
      navigate('/restaurant-setup');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, loading, hasRestaurant, navigate]);

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
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
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
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
                alt="ThinkPost" 
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold text-deep-blue dark:text-white">
                {restaurant.name} Dashboard
              </h1>
            </div>
            <UserProfilePanel restaurant={restaurant} />
          </div>
        </div>
      </header>

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
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-vibrant-purple" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => navigate('/upload')}
                    className="h-20 bg-gradient-primary hover:opacity-90 flex flex-col gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    Start & add products
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('captions')}
                  >
                    <MessageSquare className="h-6 w-6" />
                    View Captions
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('schedule')}
                  >
                    <CalendarIcon className="h-6 w-6" />
                    Schedule Post
                  </Button>
                </div>
              </CardContent>
            </Card>
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
