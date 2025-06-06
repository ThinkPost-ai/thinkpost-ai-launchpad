
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTikTokConnectionData } from './hooks/useTikTokConnectionData';
import { useLanguage } from '@/contexts/LanguageContext';
import TikTokConnectedState from './components/TikTokConnectedState';
import TikTokDisconnectedState from './components/TikTokDisconnectedState';
import TikTokLoginButton from './TikTokLoginButton';

const TikTokConnection = () => {
  const { t } = useLanguage();
  const { connection, loading, connecting, handleConnect, handleDisconnect } = useTikTokConnectionData();

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
          {t('dashboard.tiktok.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.tiktok.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <TikTokConnectedState 
            connection={connection} 
            onDisconnect={handleDisconnect} 
          />
        ) : (
          <div className="space-y-4">
            <TikTokDisconnectedState 
              connecting={connecting} 
              onConnect={handleConnect} 
            />
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Alternative: TikTok Login Kit</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Connect using TikTok's official Login Kit for enhanced features
              </p>
              <TikTokLoginButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
