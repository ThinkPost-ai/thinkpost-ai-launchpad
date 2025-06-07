
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
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tiktok_open_id, tiktok_username, tiktok_avatar_url, tiktok_connected')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching TikTok profile:', error);
        return;
      }

      setTikTokProfile({
        tiktok_open_id: data.tiktok_open_id,
        tiktok_username: data.tiktok_username,
        tiktok_avatar_url: data.tiktok_avatar_url,
        tiktok_connected: data.tiktok_connected || false,
      });
    } catch (error) {
      console.error('Error fetching TikTok profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectTikTok = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your TikTok account.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session');
      }

      const response = await fetch('/functions/v1/tiktok-auth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate TikTok OAuth');
      }

      const { authUrl } = await response.json();
      
      // Redirect to TikTok OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('TikTok connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to TikTok. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectTikTok = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tiktok_open_id: null,
          tiktok_username: null,
          tiktok_avatar_url: null,
          tiktok_access_token: null,
          tiktok_connected: false
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setTikTokProfile({
        tiktok_open_id: null,
        tiktok_username: null,
        tiktok_avatar_url: null,
        tiktok_connected: false,
      });

      toast({
        title: "TikTok Disconnected",
        description: "Your TikTok account has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting TikTok:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect TikTok. Please try again.",
        variant: "destructive"
      });
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
