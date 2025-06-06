
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TikTokConnectButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const TikTokConnectButton = ({ variant = 'default', size = 'default', className }: TikTokConnectButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      // Get the current session to pass to the edge function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to connect your TikTok account.",
          variant: "destructive"
        });
        setIsConnecting(false);
        return;
      }

      // Call the existing tiktok-auth edge function
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('TikTok auth error:', error);
        throw error;
      }

      // Redirect to TikTok OAuth URL
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error connecting TikTok:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to TikTok. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      onClick={handleConnectTikTok}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={className}
    >
      {isConnecting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Music className="mr-2 h-4 w-4" />
      )}
      {isConnecting ? 'Connecting...' : 'Connect TikTok'}
    </Button>
  );
};

export default TikTokConnectButton;
