
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TikTokProfile {
  tiktok_open_id: string | null;
  tiktok_username: string | null;
  tiktok_avatar_url: string | null;
  tiktok_connected: boolean;
}

export const useTikTokConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiktokProfile, setTikTokProfile] = useState<TikTokProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchTikTokProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tiktok_open_id, tiktok_username, tiktok_avatar_url, tiktok_connected')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setTikTokProfile(data as TikTokProfile);
    } catch (error: any) {
      console.error('Error fetching TikTok profile:', error);
      toast({
        title: "Error",
        description: "Failed to load TikTok connection status",
        variant: "destructive"
      });
    }
  };

  const connectTikTok = async () => {
    if (!user) return;

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Redirect to TikTok OAuth
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error connecting TikTok:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to TikTok. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  const disconnectTikTok = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tiktok_open_id: null,
          tiktok_username: null,
          tiktok_avatar_url: null,
          tiktok_connected: false,
          tiktok_token: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setTikTokProfile({
        tiktok_open_id: null,
        tiktok_username: null,
        tiktok_avatar_url: null,
        tiktok_connected: false,
      });

      toast({
        title: "Disconnected",
        description: "TikTok account has been disconnected successfully.",
      });
    } catch (error: any) {
      console.error('Error disconnecting TikTok:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect TikTok account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTikTokProfile();
    }
  }, [user]);

  return {
    tiktokProfile,
    isLoading,
    isConnecting,
    connectTikTok,
    disconnectTikTok,
    refetch: fetchTikTokProfile,
  };
};
