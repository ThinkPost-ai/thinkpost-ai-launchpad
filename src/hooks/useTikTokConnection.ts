
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
      console.error('❌ No user found for TikTok connection');
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your TikTok account.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      console.log('🚀 Initiating TikTok OAuth for user:', user.id);
      console.log('📡 Current user session:', await supabase.auth.getSession());
      
      // Get current session to ensure we have a valid auth token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('❌ No valid session found:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please log out and log back in, then try connecting TikTok again.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Valid session found, calling tiktok-auth function');
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('📡 Supabase function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        toast({
          title: "Connection Failed",
          description: `Failed to initiate TikTok OAuth: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!data?.authUrl) {
        console.error('❌ No auth URL received:', data);
        toast({
          title: "Connection Failed",
          description: "No authorization URL received from server.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Redirecting to TikTok OAuth URL:', data.authUrl);
      
      // Store that we're attempting TikTok connection
      localStorage.setItem('tiktok_connection_attempt', 'true');
      
      // Redirect to TikTok OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('💥 TikTok connection error:', error);
      toast({
        title: "Connection Failed",
        description: `Unexpected error: ${error.message}. Please try again.`,
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
          tiktok_refresh_token: null,
          tiktok_token_expires_at: null,
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

  // Check if we're returning from a TikTok connection attempt
  useEffect(() => {
    if (localStorage.getItem('tiktok_connection_attempt') === 'true') {
      localStorage.removeItem('tiktok_connection_attempt');
      console.log('🔍 Returned from TikTok OAuth attempt, refreshing profile...');
      // Small delay to allow for database updates
      setTimeout(() => {
        fetchTikTokProfile();
      }, 1000);
    }
  }, []);

  return {
    tiktokProfile,
    isLoading,
    isConnecting,
    connectTikTok,
    disconnectTikTok,
    refetch: fetchTikTokProfile,
  };
};
