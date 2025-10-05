
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InstagramProfile {
  connected: boolean;
  username?: string;
  userId?: string;
  avatarUrl?: string;
}

export const useInstagramConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<InstagramProfile>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchInstagramStatus = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_oauth_tokens')
        .select('instagram_connected, instagram_username, instagram_user_id, instagram_avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Instagram status:', error);
        return;
      }

      setProfile({
        connected: data.instagram_connected || false,
        username: data.instagram_username,
        userId: data.instagram_user_id,
        avatarUrl: data.instagram_avatar_url,
      });
    } catch (error) {
      console.error('Error in fetchInstagramStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectInstagram = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_oauth_tokens')
        .update({
          instagram_connected: false,
          instagram_username: null,
          instagram_user_id: null,
          instagram_avatar_url: null,
          instagram_access_token: null,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disconnecting Instagram:', error);
        toast({
          title: "Error",
          description: "Failed to disconnect Instagram account",
          variant: "destructive"
        });
        return;
      }

      setProfile({ connected: false });
      toast({
        title: "Instagram Disconnected",
        description: "Your Instagram account has been disconnected successfully",
      });
    } catch (error) {
      console.error('Error in disconnectInstagram:', error);
    }
  };

  useEffect(() => {
    fetchInstagramStatus();
  }, [user]);

  return {
    profile,
    isLoading,
    isConnecting,
    setIsConnecting,
    disconnectInstagram,
    refreshStatus: fetchInstagramStatus,
  };
};
