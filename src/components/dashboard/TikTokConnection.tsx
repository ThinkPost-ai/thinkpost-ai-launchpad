
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TikTokConnection {
  id: string;
  tiktok_user_id: string;
  tiktok_username: string;
  created_at: string;
}

const TikTokConnection = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<TikTokConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('tiktok_connections')
        .select('id, tiktok_user_id, tiktok_username, created_at')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error: any) {
      console.error('Error fetching TikTok connection:', error);
      toast({
        title: "Error",
        description: "Failed to load TikTok connection status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your TikTok account",
        variant: "destructive"
      });
      return;
    }

    setConnecting(true);
    console.log('Starting TikTok connection process...');
    
    try {
      // Call the TikTok auth endpoint directly using window.location
      const authUrl = `https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-auth`;
      
      console.log('Redirecting to TikTok auth endpoint:', authUrl);
      console.log('Using session token:', session.access_token.substring(0, 20) + '...');
      
      // Create a form to POST to the auth endpoint with the bearer token
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = authUrl;
      
      // Add authorization header by redirecting to a URL that includes the token
      window.location.href = `${authUrl}?token=${encodeURIComponent(session.access_token)}`;
      
    } catch (error: any) {
      console.error('Error connecting to TikTok:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate TikTok connection",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('tiktok_connections')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setConnection(null);
      toast({
        title: "Disconnected",
        description: "TikTok account has been disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting TikTok:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect TikTok account",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vibrant-purple mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          TikTok Connection
        </CardTitle>
        <CardDescription>
          Connect your TikTok account to schedule and post content directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-deep-blue dark:text-white">
                  @{connection.tiktok_username}
                </p>
                <p className="text-sm text-muted-foreground">
                  Connected on {new Date(connection.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Connected
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.tiktok.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect TikTok Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to disconnect your TikTok account? This will remove the ability to post directly to TikTok from ThinkPost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No TikTok account connected
            </p>
            <Button 
              onClick={handleConnect}
              disabled={connecting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center mr-2">
                    <span className="text-black text-xs font-bold">T</span>
                  </div>
                  Connect TikTok
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Note: Make sure you have the correct TikTok Client ID configured</p>
              <p>Redirect URI should be: https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-callback</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
