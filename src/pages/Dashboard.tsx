
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
      } else {
        // Redirect to the new user dashboard
        navigate('/user-dashboard');
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

  // This component now serves as a redirect component
  return null;
};

export default Dashboard;
