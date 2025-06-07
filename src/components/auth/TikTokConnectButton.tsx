
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Loader2 } from 'lucide-react';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';

interface TikTokConnectButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const TikTokConnectButton = ({ variant = 'default', size = 'default', className }: TikTokConnectButtonProps) => {
  const { connectTikTok, isConnecting } = useTikTokConnection();

  const handleConnectTikTok = async () => {
    await connectTikTok();
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
