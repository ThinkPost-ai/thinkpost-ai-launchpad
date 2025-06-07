
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Music, CheckCircle, Loader2 } from 'lucide-react';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';

const TikTokConnection = () => {
  const { tiktokProfile, isLoading, isConnecting, connectTikTok, disconnectTikTok } = useTikTokConnection();

  if (isLoading) {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = tiktokProfile?.tiktok_connected;

  return (
    <Card className={`border-2 hover:shadow-lg transition-shadow ${isConnected ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-600' : 'bg-black'}`}>
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              TikTok Connection
              {isConnected && <CheckCircle className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? `Connected as @${tiktokProfile.tiktok_username || 'TikTok User'}`
                : 'Connect your TikTok account to enhance your posts'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tiktokProfile.tiktok_avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <Music className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">@{tiktokProfile.tiktok_username || 'TikTok User'}</p>
                <p className="text-sm text-muted-foreground">Connected to TikTok</p>
              </div>
            </div>
            
            <Button 
              onClick={disconnectTikTok}
              variant="outline"
              className="w-full"
            >
              Disconnect TikTok
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your TikTok account to access additional features and enhance your content creation.
              </p>
            </div>
            
            <Button 
              onClick={connectTikTok}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Connect TikTok
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
