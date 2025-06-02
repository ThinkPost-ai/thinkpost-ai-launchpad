
import { Button } from '@/components/ui/button';

interface TikTokDisconnectedStateProps {
  connecting: boolean;
  onConnect: () => void;
}

const TikTokDisconnectedState = ({ connecting, onConnect }: TikTokDisconnectedStateProps) => {
  return (
    <div className="text-center space-y-4">
      <p className="text-muted-foreground">
        No TikTok account connected
      </p>
      <Button 
        onClick={onConnect}
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
        <p>Note: You'll be redirected to TikTok to authorize the connection</p>
        <p>Redirect URI: https://thinkpost.co/api/tiktok/callback</p>
      </div>
    </div>
  );
};

export default TikTokDisconnectedState;
