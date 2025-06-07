
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TikTokConnectButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const TikTokConnectButton = ({ variant = 'default', size = 'default', className }: TikTokConnectButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnectTikTok = async () => {
    toast({
      title: "Feature Unavailable",
      description: "TikTok connection has been disabled.",
      variant: "destructive"
    });
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
