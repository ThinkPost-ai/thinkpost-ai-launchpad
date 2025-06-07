
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    // TikTok functionality removed
    setTikTokProfile({
      tiktok_open_id: null,
      tiktok_username: null,
      tiktok_avatar_url: null,
      tiktok_connected: false,
    });
  };

  const connectTikTok = async () => {
    toast({
      title: "Feature Unavailable",
      description: "TikTok connection has been disabled.",
      variant: "destructive"
    });
  };

  const disconnectTikTok = async () => {
    toast({
      title: "Feature Unavailable",
      description: "TikTok connection has been disabled.",
      variant: "destructive"
    });
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
