
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music } from 'lucide-react';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useLanguage } from '@/contexts/LanguageContext';

const TikTokConnection = () => {
  const { t } = useLanguage();
  const { tiktokProfile, isLoading, isConnecting, connectTikTok, disconnectTikTok } = useTikTokConnection();

  const isConnected = tiktokProfile?.tiktok_connected || false;

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Connect your TikTok account</CardTitle>
            <CardDescription>
              Enable AI-generated captions to be posted directly to your TikTok account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected && tiktokProfile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={tiktokProfile.tiktok_avatar_url || ''} 
                  alt={tiktokProfile.tiktok_username || 'TikTok User'} 
                />
                <AvatarFallback className="bg-black text-white">
                  <Music className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {tiktokProfile.tiktok_username || 'TikTok User'}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Connected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your TikTok account is connected and ready for posting
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={disconnectTikTok}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect TikTok
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your TikTok account to enable direct posting of your AI-generated content.
              </p>
            </div>
            
            <Button 
              onClick={connectTikTok}
              disabled={isConnecting}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConnecting ? 'Connecting...' : 'Connect TikTok'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
