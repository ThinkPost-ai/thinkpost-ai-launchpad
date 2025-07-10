
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProfileForm from '@/components/profile/ProfileForm';
import RestaurantForm from '@/components/profile/RestaurantForm';
import { useDashboardData } from '@/hooks/useDashboardData';

const ProfileSettings = () => {
  const { user, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { restaurant, isLoading } = useDashboardData();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <DashboardHeader restaurant={restaurant} />

      <div className="container mx-auto px-4 py-6">
        <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className={`mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t('upload.backToDashboard')}
          </Button>
          <h1 className={`text-3xl font-bold text-deep-blue dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('profileSettings.title')}
          </h1>
          <p className={`text-gray-600 dark:text-gray-300 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('profileSettings.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
              <CardTitle>{t('profileSettings.personalInfo.title')}</CardTitle>
              <CardDescription>
                {t('profileSettings.personalInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>

          {/* Brand Information */}
          <Card>
            <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
              <CardTitle>{t('profileSettings.brandInfo.title')}</CardTitle>
              <CardDescription>
                {t('profileSettings.brandInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestaurantForm restaurant={restaurant} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
