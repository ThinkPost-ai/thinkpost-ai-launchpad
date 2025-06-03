
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { TikTokConnection } from '../types/tiktok';

interface TikTokConnectedStateProps {
  connection: TikTokConnection;
  onDisconnect: () => void;
}

const TikTokConnectedState = ({ connection, onDisconnect }: TikTokConnectedStateProps) => {
  // Check if connection has video publishing permissions
  const hasVideoPublish = connection.scope?.includes('video.publish') || false;
  const hasVideoUpload = connection.scope?.includes('video.upload') || false;
  
  // Check if token is expiring soon
  const isTokenExpiring = () => {
    if (!connection.token_expires_at) return false;
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiresAt < oneWeekFromNow;
  };

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
          {connection.token_expires_at && (
            <p className="text-xs text-muted-foreground">
              Token expires: {new Date(connection.token_expires_at).toLocaleDateString()}
              {isTokenExpiring() && (
                <span className="text-amber-600 ml-1">(Expires soon)</span>
              )}
            </p>
          )}
        </div>
        <Badge variant="default" className="bg-green-500">
          Connected
        </Badge>
      </div>
      
      {/* Permission Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Permissions:</h4>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Basic Info</span>
          </div>
          {hasVideoUpload ? (
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Video Upload</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <span>Video Upload (Missing)</span>
            </div>
          )}
          {hasVideoPublish ? (
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Video Publish</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span>Video Publish (Missing)</span>
            </div>
          )}
        </div>
        
        {(!hasVideoPublish || !hasVideoUpload) && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
            <p className="text-xs text-amber-800">
              <strong>Missing permissions:</strong> To post videos to TikTok, you need to reconnect and authorize all permissions.
            </p>
          </div>
        )}
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
