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
      console.log('=== Frontend: Fetching TikTok config ===');
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
      
      console.log('=== Frontend: TikTok config received ===');
      console.log('Has client key:', !!data?.clientKey);
      console.log('Client key length:', data?.clientKey?.length || 0);
      console.log('Client key preview:', data?.clientKey?.substring(0, 8) + '...');
      console.log('Redirect URI:', data?.redirectUri);
      console.log('Debug info:', data?.debug);
      
      // Enhanced frontend validation
      if (!data?.clientKey) {
        throw new Error('No client key received from configuration');
      }
      
      const clientKey = String(data.clientKey).trim();
      if (clientKey.length === 0) {
        throw new Error('Client key is empty');
      }
      
      // Aggressive validation - ensure only alphanumeric characters
      const cleanKey = clientKey.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanKey !== clientKey) {
        console.error('Frontend: Client key contains non-alphanumeric characters');
        console.error('Original key:', clientKey);
        console.error('Clean key:', cleanKey);
        throw new Error('Client key contains invalid characters. Configuration may be corrupted.');
      }
      
      if (clientKey.length < 10) {
        throw new Error('Client key appears to be too short');
      }
      
      // Validate typical TikTok client key format (should be alphanumeric, 16-24 chars)
      if (clientKey.length < 16 || clientKey.length > 30) {
        console.warn('Frontend: Client key length is unusual for TikTok:', clientKey.length);
        console.warn('Expected range: 16-30 characters');
      }
      
      console.log('Frontend validation passed');
      return data;
    } catch (error: any) {
      console.error('Error getting TikTok config:', error);
      
      // Enhanced error messaging
      if (error.message?.includes('not configured')) {
        throw new Error('TikTok integration is not properly configured. Please contact support.');
      } else if (error.message?.includes('Authorization required')) {
        throw new Error('Authentication failed. Please try logging in again.');
      } else if (error.message?.includes('invalid characters') || error.message?.includes('corrupted')) {
        throw new Error('TikTok configuration contains invalid characters. Please check your TikTok Client ID and Secret.');
      } else if (error.message?.includes('too short')) {
        throw new Error('TikTok Client ID appears to be incomplete. Please verify your configuration.');
      } else {
        throw new Error('Failed to get TikTok configuration. Please try again.');
      }
    }
  };

  const handleConnect = async () => {
    console.log('=== Frontend: Starting TikTok connection ===');
    console.log('Session available:', !!session?.access_token);
    console.log('User available:', !!user);
    
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
    
    try {
      // Get TikTok configuration from backend
      const config = await getTikTokConfig();
      
      if (!config || !config.clientKey) {
        throw new Error('TikTok client key not available');
      }
      
      console.log('=== Frontend: Building OAuth URL ===');
      console.log('Using client key length:', config.clientKey.length);
      console.log('Using redirect URI:', config.redirectUri);
      console.log('Debug info:', config.debug);
      
      // Generate state token for CSRF protection
      const state = crypto.randomUUID();
      
      // Store state token in localStorage for verification after redirect
      localStorage.setItem('tiktok_oauth_state', state);
      localStorage.setItem('tiktok_user_token', session.access_token);
      
      // Use the validated client key directly (already cleaned by backend)
      const clientKey = config.clientKey;
      console.log('Final client key length:', clientKey.length);
      console.log('Final client key preview:', clientKey.substring(0, 8) + '...');
      
      // Build TikTok OAuth URL following TikTok's exact specification
      const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';
      const scope = 'user.info.basic,video.upload,video.publish';
      
      const params = new URLSearchParams();
      params.append('client_key', clientKey);
      params.append('response_type', 'code');
      params.append('scope', scope);
      params.append('redirect_uri', config.redirectUri);
      params.append('state', state);
      
      const tiktokAuthUrl = `${baseUrl}?${params.toString()}`;
      
      console.log('=== Frontend: Final OAuth URL ===');
      console.log('Base URL:', baseUrl);
      console.log('Client Key (preview):', clientKey.substring(0, 10) + '...');
      console.log('Scope:', scope);
      console.log('Redirect URI:', config.redirectUri);
      console.log('State:', state);
      console.log('Full URL length:', tiktokAuthUrl.length);
      console.log('URL preview:', tiktokAuthUrl.substring(0, 150) + '...');
      
      toast({
        title: "Redirecting to TikTok",
        description: "Please authorize all permissions including video publishing when prompted",
      });
      
      // Force redirect in top-level window
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
