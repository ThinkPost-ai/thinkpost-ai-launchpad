
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTikTokAuth = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for TikTok authentication callback parameters
    checkTikTokAuthCallback();
  }, []);

  const checkTikTokAuthCallback = async () => {
    const storedCode = localStorage.getItem('tiktok_callback_code');
    const storedState = localStorage.getItem('tiktok_callback_state');
    const authMode = localStorage.getItem('tiktok_auth_mode');
    
    if (storedCode && storedState && authMode === 'login') {
      console.log('Found stored TikTok auth callback parameters, processing...');
      setLoading(true);
      
      try {
        const { data, error: functionError } = await supabase.functions.invoke('tiktok-auth-callback', {
          body: { code: storedCode, state: storedState, mode: 'auth' },
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        console.log('TikTok authentication successful:', data);
        
        toast({
          title: "Welcome to ThinkPost!",
          description: `Successfully signed in with your TikTok account`,
        });
        
        // Clean up stored values
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
        localStorage.removeItem('tiktok_auth_state');
        localStorage.removeItem('tiktok_auth_mode');
        
        // Refresh the page to update auth state
        window.location.href = '/dashboard';
        
      } catch (error: any) {
        console.error('Error processing TikTok authentication:', error);
        
        let errorMessage = "Failed to sign in with TikTok";
        if (error.message?.includes('user_not_found')) {
          errorMessage = "TikTok account not found. Please try again or contact support.";
        } else if (error.message?.includes('expired')) {
          errorMessage = "Authentication expired. Please try signing in again";
        }
        
        toast({
          title: "Sign In Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Clean up stored values
        localStorage.removeItem('tiktok_callback_code');
        localStorage.removeItem('tiktok_callback_state');
        localStorage.removeItem('tiktok_auth_state');
        localStorage.removeItem('tiktok_auth_mode');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    loading,
    checkTikTokAuthCallback
  };
};
