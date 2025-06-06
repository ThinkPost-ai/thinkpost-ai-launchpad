
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TikTokSignInButtonProps {
  onSuccess: () => void;
}

const TikTokSignInButton = ({ onSuccess }: TikTokSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTikTokSignIn = async () => {
    setIsLoading(true);
    console.log('Starting TikTok authentication...');
    
    try {
      // Get TikTok configuration from our edge function
      const { data: config, error: configError } = await supabase.functions.invoke('get-tiktok-config', {
        headers: {
          Authorization: `Bearer ${supabase.supabaseKey}`,
        },
      });

      if (configError) {
        console.error('Config error:', configError);
        throw new Error(configError.message || 'Failed to get TikTok configuration');
      }

      if (!config || !config.clientKey) {
        console.error('No client key in config:', config);
        throw new Error('TikTok client key not available');
      }
      
      console.log('TikTok config received for auth:', {
        hasClientKey: !!config.clientKey,
        redirectUri: config.redirectUri
      });
      
      // Generate state token for CSRF protection
      const state = crypto.randomUUID();
      
      // Store state token in localStorage for verification after redirect
      localStorage.setItem('tiktok_auth_state', state);
      localStorage.setItem('tiktok_auth_mode', 'login'); // Distinguish from connection mode
      
      // Build TikTok OAuth URL for authentication
      const authParams = new URLSearchParams({
        client_key: config.clientKey,
        scope: 'user.info.basic,user.info.profile,user.info.stats',
        response_type: 'code',
        redirect_uri: config.redirectUri,
        state: state
      });
      
      const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?${authParams.toString()}`;
      
      console.log('TikTok OAuth URL for authentication:', tiktokAuthUrl);
      
      toast({
        title: "Redirecting to TikTok",
        description: "Please sign in with your TikTok account",
      });
      
      // Small delay to ensure toast is visible
      setTimeout(() => {
        // Force redirect in top-level window
        if (window.top) {
          window.top.location.href = tiktokAuthUrl;
        } else {
          window.location.href = tiktokAuthUrl;
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error initiating TikTok sign-in:', error);
      
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to initiate TikTok sign-in",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTikTokSignIn}
      disabled={isLoading}
      className="w-full bg-black hover:bg-gray-800 text-white"
      variant="outline"
    >
      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2">
        <span className="text-black text-xs font-bold">T</span>
      </div>
      {isLoading ? 'Connecting...' : 'Sign in with TikTok'}
    </Button>
  );
};

export default TikTokSignInButton;
