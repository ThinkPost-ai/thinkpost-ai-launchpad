
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTikTokConnectionData } from './hooks/useTikTokConnectionData';
import { useLanguage } from '@/contexts/LanguageContext';
import TikTokConnectedState from './components/TikTokConnectedState';
import TikTokDisconnectedState from './components/TikTokDisconnectedState';

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
          <TikTokDisconnectedState 
            connecting={connecting} 
            onConnect={handleConnect} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TikTokConnection;
