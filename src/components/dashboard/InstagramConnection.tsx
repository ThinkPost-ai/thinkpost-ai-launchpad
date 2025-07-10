import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram, CheckCircle, Loader2 } from 'lucide-react';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InstagramConnection = () => {
  const { profile, isLoading, isConnecting, setIsConnecting, disconnectInstagram } = useInstagramConnection();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get current user session to include authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Call the instagram-auth function to get the proper OAuth URL
      const { data, error } = await supabase.functions.invoke('instagram-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Instagram auth error:', error);
        throw new Error(error.message || 'Failed to initialize Instagram connection');
      }

      if (!data?.authUrl) {
        throw new Error('No authorization URL received from server');
      }

      // Redirect to the proper Facebook OAuth URL
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Instagram connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect Instagram account. Please try again.',
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center py-6">
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
                : "Ready to connect"
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
            <div className="text-center py-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
                <Instagram className="h-6 w-6 text-white" />
              </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstagramConnection;
