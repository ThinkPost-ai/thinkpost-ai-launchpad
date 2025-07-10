
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileData {
  full_name: string;
  display_name: string;
  avatar_url: string;
}

const ProfileForm = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    display_name: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          display_name: data.display_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: t('profileForm.success'),
        description: t('profileForm.successDescription'),
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profileForm.error'),
        description: t('profileForm.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
        <Avatar className="h-16 w-16">
          <AvatarImage src={profileData.avatar_url} />
          <AvatarFallback className="bg-vibrant-purple text-white text-lg">
            {getInitials(profileData.full_name || user?.email || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <Label htmlFor="avatar_url">{t('profileForm.avatarUrl')}</Label>
          <Input
            id="avatar_url"
            type="url"
            value={profileData.avatar_url}
            onChange={(e) => handleInputChange('avatar_url', e.target.value)}
            placeholder={t('profileForm.avatarUrlPlaceholder')}
            className="mt-1"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Email (read-only) */}
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <Label htmlFor="email">{t('profileForm.email')}</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ''}
          disabled
          className="mt-1 bg-gray-50 dark:bg-gray-800"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Full Name */}
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <Label htmlFor="full_name">{t('profileForm.fullName')}</Label>
        <Input
          id="full_name"
          type="text"
          value={profileData.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          placeholder={t('profileForm.fullNamePlaceholder')}
          className="mt-1"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Display Name */}
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <Label htmlFor="display_name">{t('profileForm.displayName')}</Label>
        <Input
          id="display_name"
          type="text"
          value={profileData.display_name}
          onChange={(e) => handleInputChange('display_name', e.target.value)}
          placeholder={t('profileForm.displayNamePlaceholder')}
          className="mt-1"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-primary hover:opacity-90"
      >
        {isLoading ? t('profileForm.updating') : t('profileForm.updateProfile')}
      </Button>
    </form>
  );
};

export default ProfileForm;
