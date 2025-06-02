
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TikTokConnection } from '../types/tiktok';

export const useTikTokConnectionData = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<TikTokConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('tiktok_connections')
        .select('id, tiktok_user_id, tiktok_username, created_at')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error: any) {
      console.error('Error fetching TikTok connection:', error);
      toast({
        title: "Error",
        description: "Failed to load TikTok connection status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your TikTok account",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);
    console.log('Starting TikTok connection process...');
    
    try {
      // Redirect directly to the TikTok auth endpoint with the token
      const authUrl = `https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-auth?token=${encodeURIComponent(session.access_token)}`;
      
      console.log('Redirecting to TikTok auth endpoint:', authUrl);
      console.log('Using session token:', session.access_token.substring(0, 20) + '...');
      
      // Direct redirect - no need to handle response since we're leaving the page
      window.location.href = authUrl;
      
      // Note: Code after window.location.href won't execute as we're navigating away
      
    } catch (error: any) {
      console.error('Error connecting to TikTok:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate TikTok connection",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('tiktok_connections')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setConnection(null);
      toast({
        title: "Disconnected",
        description: "TikTok account has been disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting TikTok:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect TikTok account",
        variant: "destructive"
      });
    }
  };

  return {
    connection,
    loading,
    connecting,
    handleConnect,
    handleDisconnect,
    fetchConnection
  };
};
