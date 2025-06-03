
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, ExternalLink } from 'lucide-react';
import { TikTokConnection } from '../types/tiktok';

interface TikTokConnectedStateProps {
  connection: TikTokConnection;
  onDisconnect: () => void;
}

const TikTokConnectedState = ({ connection, onDisconnect }: TikTokConnectedStateProps) => {
  return (
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
              <AlertDialogAction onClick={onDisconnect} className="bg-red-600 hover:bg-red-700">
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TikTokConnectedState;
