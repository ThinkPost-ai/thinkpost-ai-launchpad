
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  vision?: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchRestaurant();
    }
  }, [user, loading, navigate]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      setRestaurant(data);
      
      if (!data) {
        navigate('/restaurant-setup');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple" />
      </div>
    );
  }

  if (!restaurant) {
    return null; // Will redirect to setup
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            Welcome back to {restaurant.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your restaurant's social media presence and grow your brand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="h-6 w-6 text-vibrant-purple" />
                <CardTitle className="text-lg">Upload Images</CardTitle>
              </div>
              <CardDescription>
                Upload photos of your delicious dishes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/upload')}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Start Uploading
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-vibrant-purple" />
                <CardTitle className="text-lg">AI Captions</CardTitle>
              </div>
              <CardDescription>
                Generate engaging captions with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/images')}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Manage Images
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-vibrant-purple" />
                <CardTitle className="text-lg">Analytics</CardTitle>
              </div>
              <CardDescription>
                Track your social media performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Profile</CardTitle>
            <CardDescription>Your restaurant information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-lg font-semibold text-deep-blue dark:text-white">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-lg font-semibold text-deep-blue dark:text-white">{restaurant.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</p>
              <p className="text-lg font-semibold text-deep-blue dark:text-white capitalize">
                {restaurant.category.replace('_', ' ')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vision</p>
              <p className="text-gray-700 dark:text-gray-300">{restaurant.vision || 'No vision set'}</p>
            </div>
            <div className="md:col-span-2">
              <Button 
                onClick={() => navigate('/restaurant-setup')}
                variant="outline"
                className="mt-4"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
