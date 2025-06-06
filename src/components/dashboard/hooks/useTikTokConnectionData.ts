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
          description: `Successfully connected your TikTok account with video publishing permissions`,
        });
        
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
        
        fetchConnection();
        
      } catch (error: any) {
        console.error('Error processing stored TikTok callback:', error);
        
        let errorMessage = "Failed to complete TikTok connection";
        if (error.message?.includes('insufficient permissions')) {
          errorMessage = "Please reconnect and authorize all required permissions including video publishing";
        } else if (error.message?.includes('expired')) {
          errorMessage = "Authorization expired. Please try connecting again";
        }
        
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
      }
    }
  };

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('tiktok_connections')
        .select('id, tiktok_user_id, tiktok_username, created_at, scope, token_expires_at')
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
      console.log('Fetching TikTok config from backend...');
      console.log('Session token available:', !!session?.access_token);
      
      const { data, error } = await supabase.functions.invoke('get-tiktok-config', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('TikTok config received:', { 
        hasClientKey: !!data?.clientKey, 
        clientKeyLength: data?.clientKey?.length,
        clientKeyStart: data?.clientKey?.substring(0, 8),
        redirectUri: data?.redirectUri 
      });
      
      // Validate the received config
      if (!data?.clientKey) {
        throw new Error('No client key received from configuration');
      }
      
      // Additional frontend validation
      const clientKey = String(data.clientKey).trim();
      if (clientKey.length === 0) {
        throw new Error('Client key is empty');
      }
      
      // Check for invalid characters
      if (!/^[a-zA-Z0-9]+$/.test(clientKey)) {
        throw new Error('Client key contains invalid characters. Only letters and numbers are allowed.');
      }
      
      if (clientKey.length < 10) {
        throw new Error('Client key appears to be too short');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error getting TikTok config:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('not configured')) {
        throw new Error('TikTok integration is not properly configured. Please contact support.');
      } else if (error.message?.includes('Authorization required')) {
        throw new Error('Authentication failed. Please try logging in again.');
      } else if (error.message?.includes('invalid characters')) {
        throw new Error('TikTok configuration contains invalid characters. Please contact support.');
      } else {
        throw new Error('Failed to get TikTok configuration. Please try again.');
      }
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
      
      console.log('Using TikTok config:', {
        hasClientKey: !!config.clientKey,
        clientKeyLength: config.clientKey?.length || 0,
        clientKeyStart: config.clientKey?.substring(0, 8),
        redirectUri: config.redirectUri
      });
      
      // Generate state token for CSRF protection
      const state = crypto.randomUUID();
      
      // Store state token in localStorage for verification after redirect
      localStorage.setItem('tiktok_oauth_state', state);
      localStorage.setItem('tiktok_user_token', session.access_token);
      
      // Enhanced client key cleaning - remove any remaining whitespace and validate
      const cleanClientKey = String(config.clientKey).replace(/\s/g, '');
      console.log('Final clean client key length:', cleanClientKey.length);
      console.log('Final clean client key preview:', cleanClientKey.substring(0, 8) + '...');
      
      // Final validation before redirect
      if (!/^[a-zA-Z0-9]+$/.test(cleanClientKey)) {
        throw new Error('Client key contains invalid characters after cleaning');
      }
      
      // Build TikTok OAuth URL with proper encoding - TikTok requires specific parameter order
      const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';
      const params = [
        `client_key=${encodeURIComponent(cleanClientKey)}`,
        'response_type=code',
        `scope=${encodeURIComponent('user.info.basic,video.upload,video.publish')}`,
        `redirect_uri=${encodeURIComponent(config.redirectUri)}`,
        `state=${encodeURIComponent(state)}`
      ];
      
      const tiktokAuthUrl = `${baseUrl}?${params.join('&')}`;
      
      console.log('TikTok OAuth URL parameters:', {
        client_key: cleanClientKey.substring(0, 10) + '...',
        scope: 'user.info.basic,video.upload,video.publish',
        redirect_uri: config.redirectUri,
        state: state,
        fullUrl: tiktokAuthUrl.substring(0, 100) + '...'
      });
      
      toast({
        title: "Redirecting to TikTok",
        description: "Please authorize all permissions including video publishing when prompted",
      });
      
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

  const checkTokenHealth = async () => {
    if (!connection || !session?.access_token) return null;

    try {
      const { data, error } = await supabase.functions.invoke('refresh-tiktok-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error && error.message?.includes('requires_reconnection')) {
        toast({
          title: "TikTok Connection Expired",
          description: "Please reconnect your TikTok account",
          variant: "destructive"
        });
        setConnection(null);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token health check failed:', error);
      return null;
    }
  };

  return {
    connection,
    loading,
    connecting,
    handleConnect,
    handleDisconnect,
    fetchConnection,
    checkTokenHealth
  };
};
