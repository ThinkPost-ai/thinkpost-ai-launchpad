import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InstagramConnection = () => {
  const { profile, isLoading, isConnecting, setIsConnecting, disconnectInstagram } = useInstagramConnection();

  const handleConnect = () => {
    setIsConnecting(true);
    const instagramAuthUrl = "https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1092698762721463&redirect_uri=https://thinkpost.co/instagram-callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";
    window.location.href = instagramAuthUrl;
  };

  if (isLoading) {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 hover:shadow-lg transition-shadow ${profile.connected ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${profile.connected ? 'bg-green-600' : 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500'}`}>
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Instagram Business
              {profile.connected && <CheckCircle className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {profile.connected 
                ? `Connected as @${profile.username}`
                : "Connect your Instagram Business account to get started."
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {profile.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white">
                  <Instagram className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">@{profile.username}</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            
            <Button 
              onClick={disconnectInstagram}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Instagram Business Account Required:</strong> Make sure you have an Instagram Business account connected to a Facebook Page before connecting.
              </AlertDescription>
            </Alert>
            
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Instagram Business account to automatically post content.
              </p>
            </div>
            
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 hover:from-yellow-500 hover:via-red-600 hover:to-pink-600"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Instagram className="mr-2 h-4 w-4" />
                  Connect Instagram Business
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Requirements:</p>
              <ul className="text-left space-y-1 ml-4">
                <li>• Instagram Business or Creator account</li>
                <li>• Connected to a Facebook Page</li>
                <li>• Page admin access</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstagramConnection;
