
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useTikTokConnection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for TikTok connection success
    const tiktokConnected = searchParams.get('tiktok_connected');
    const username = searchParams.get('username');
    const accessToken = searchParams.get('access_token');
    const tiktokUserId = searchParams.get('tiktok_user_id');
    const tiktokError = searchParams.get('tiktok_error');
    
    if (tiktokError) {
      toast({
        title: "TikTok Connection Failed",
        description: `Failed to connect TikTok: ${tiktokError}`,
        variant: "destructive"
      });
      navigate('/user-dashboard', { replace: true });
    } else if (tiktokConnected === 'true' && username && accessToken && tiktokUserId && user) {
      // Store the TikTok connection in the database
      const storeTikTokConnection = async () => {
        try {
          const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(); // 24 hours from now
          
          const { error } = await supabase
            .from('tiktok_connections')
            .upsert({
              user_id: user.id,
              tiktok_user_id: decodeURIComponent(tiktokUserId),
              tiktok_username: decodeURIComponent(username),
              access_token: decodeURIComponent(accessToken),
              token_expires_at: expiresAt,
              scope: 'user.info.basic',
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error storing TikTok connection:', error);
            toast({
              title: "Warning",
              description: "TikTok connected but failed to save connection details",
              variant: "destructive"
            });
          } else {
            toast({
              title: "TikTok Connected!",
              description: `Successfully connected @${decodeURIComponent(username)} to your ThinkPost account`,
            });
          }
        } catch (error) {
          console.error('Error storing TikTok connection:', error);
          toast({
            title: "Warning",
            description: "TikTok connected but failed to save connection details",
            variant: "destructive"
          });
        }
      };

      storeTikTokConnection();
      // Clean up URL parameters
      navigate('/user-dashboard', { replace: true });
    }
  }, [searchParams, toast, navigate, user]);
};
