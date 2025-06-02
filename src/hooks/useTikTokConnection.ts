
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useTikTokConnection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for TikTok connection success
    const tiktokConnected = searchParams.get('tiktok_connected');
    const username = searchParams.get('username');
    const tiktokError = searchParams.get('tiktok_error');
    
    if (tiktokError) {
      toast({
        title: "TikTok Connection Failed",
        description: `Failed to connect TikTok: ${tiktokError}`,
        variant: "destructive"
      });
      navigate('/user-dashboard', { replace: true });
    } else if (tiktokConnected === 'true' && username) {
      toast({
        title: "TikTok Connected!",
        description: `Successfully connected @${decodeURIComponent(username)} to your ThinkPost account`,
      });
      // Clean up URL parameters
      navigate('/user-dashboard', { replace: true });
    }
  }, [searchParams, toast, navigate]);
};
