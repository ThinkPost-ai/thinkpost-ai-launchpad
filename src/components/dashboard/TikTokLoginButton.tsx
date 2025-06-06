
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const TikTokLoginButton = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  const handleTikTokLogin = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your TikTok account",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);
    
    try {
      console.log('Starting TikTok login process...');
      
      // Call the tiktok-login-start function
      const { data, error } = await supabase.functions.invoke('tiktok-login-start', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.auth_url) {
        throw new Error('No auth URL received');
      }

      console.log('Redirecting to TikTok OAuth...');
      
      toast({
        title: "Redirecting to TikTok",
        description: "Please authorize the app to connect your TikTok account",
      });
      
      // Redirect to TikTok OAuth
      window.location.href = data.auth_url;
      
    } catch (error: any) {
      console.error('Error starting TikTok login:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate TikTok login",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  return (
    <Button 
      onClick={handleTikTokLogin}
      disabled={connecting}
      className="bg-black hover:bg-gray-800 text-white"
    >
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <div className="mr-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <span className="text-black text-xs font-bold">T</span>
          </div>
          Connect TikTok
        </>
      )}
    </Button>
  );
};

export default TikTokLoginButton;
