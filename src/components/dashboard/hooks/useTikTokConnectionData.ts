
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
      // Check for stored TikTok callback parameters after login
      checkStoredTikTokCallback();
    }
  }, [user, session]);

  const checkStoredTikTokCallback = async () => {
    const storedCode = localStorage.getItem('tiktok_callback_code');
    const storedState = localStorage.getItem('tiktok_callback_state');
    
    if (storedCode && storedState && session?.access_token) {
      console.log('Found stored TikTok callback parameters, processing...');
      
      try {
        const { data, error: functionError } = await supabase.functions.invoke('tiktok-callback', {
          body: { code: storedCode, state: storedState },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        console.log('TikTok connection successful:', data);
        
        toast({
          title: "TikTok Connected!",
          description: `Successfully connected your TikTok account`,
        });
        
        // Clear stored parameters
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
        
        // Refresh connection status
        fetchConnection();
        
      } catch (error: any) {
        console.error('Error processing stored TikTok callback:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to complete TikTok connection",
          variant: "destructive"
        });
        
        // Clear stored parameters even on error
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
      }
    }
  };

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

  const getTikTokConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-tiktok-config', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error getting TikTok config:', error);
      throw new Error('Failed to get TikTok configuration');
    }
  };

  const handleConnect = async () => {
    console.log('handleConnect called, checking session:', session?.access_token ? 'present' : 'missing');
    console.log('User state:', user ? 'present' : 'missing');
    
    if (!session?.access_token || !user) {
      console.error('No valid session or user found');
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
      // Get TikTok configuration from backend
      const config = await getTikTokConfig();
      
      if (!config || !config.clientKey) {
        throw new Error('TikTok client key not available');
      }
      
      // Generate state token for CSRF protection
      const state = crypto.randomUUID();
      
      // Store state token in localStorage for verification after redirect
      localStorage.setItem('tiktok_oauth_state', state);
      localStorage.setItem('tiktok_user_token', session.access_token);
      
      // Build TikTok OAuth URL with correct scope for video publishing
      const tiktokAuthUrl = 'https://www.tiktok.com/v2/auth/authorize/' +
        '?client_key=' + encodeURIComponent(config.clientKey) +
        '&response_type=code' +
        '&scope=' + encodeURIComponent('user.info.basic,video.publish') +
        '&redirect_uri=' + encodeURIComponent(config.redirectUri) +
        '&state=' + encodeURIComponent(state);
      
      console.log('Redirecting to TikTok OAuth:', tiktokAuthUrl);
      
      // Force redirect in top-level window to avoid CORS issues
      if (window.top) {
        window.top.location.href = tiktokAuthUrl;
      } else {
        window.location.href = tiktokAuthUrl;
      }
      
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
