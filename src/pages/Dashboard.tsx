
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, hasRestaurant, checkingProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user && !checkingProfile && hasRestaurant !== null) {
      if (hasRestaurant) {
        navigate('/user-dashboard');
      } else {
        navigate('/restaurant-setup');
      }
    }
  }, [user, loading, hasRestaurant, checkingProfile, navigate]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // This component now serves as a redirect component
  return null;
};

export default Dashboard;
