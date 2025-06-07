
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TikTokConnection = () => {
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: "Feature Unavailable",
      description: "TikTok connection has been disabled.",
      variant: "destructive"
    });
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow opacity-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">TikTok Connection (Disabled)</CardTitle>
            <CardDescription>
              TikTok integration is currently unavailable.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              TikTok connection functionality has been disabled.
            </p>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={true}
            className="w-full bg-gray-400 cursor-not-allowed"
          >
            TikTok Connection Disabled
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
