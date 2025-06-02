
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTikTokConnection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for TikTok connection success
    const tiktokConnected = searchParams.get('tiktok_connected');
    const username = searchParams.get('username');
    const tiktokUserId = searchParams.get('tiktok_user_id');
    const tiktokError = searchParams.get('tiktok_error');
    
    if (tiktokError) {
      toast({
        title: "TikTok Connection Failed",
        description: `Failed to connect TikTok: ${tiktokError}`,
        variant: "destructive"
      });
      navigate('/user-dashboard', { replace: true });
    } else if (tiktokConnected === 'true' && username && tiktokUserId && user) {
      handleTikTokConnection(tiktokUserId, username);
    }
  }, [searchParams, toast, navigate, user]);

  const handleTikTokConnection = async (tiktokUserId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('tiktok_connections')
        .upsert({
          user_id: user?.id,
          tiktok_user_id: tiktokUserId,
          tiktok_username: username,
          access_token: 'temp_token', // We'll need to improve this flow
          created_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('Error storing TikTok connection:', error);
        toast({
          title: "Connection Error",
          description: "TikTok connected but failed to save to your account. Please try connecting again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "TikTok Connected!",
          description: `Successfully connected @${username} to your ThinkPost account`,
        });
      }
    } catch (error) {
      console.error('Error in handleTikTokConnection:', error);
      toast({
        title: "Connection Error",
        description: "TikTok connected but failed to save to your account. Please try connecting again.",
        variant: "destructive"
      });
    } finally {
      // Clean up URL parameters
      navigate('/user-dashboard', { replace: true });
    }
  };
};
