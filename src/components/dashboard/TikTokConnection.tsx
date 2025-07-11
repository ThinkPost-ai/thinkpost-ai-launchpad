import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TikTokIcon from '@/components/ui/TikTokIcon';
import { CheckCircle, Loader2, User } from 'lucide-react';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useLanguage } from '@/contexts/LanguageContext';

const TikTokConnection = () => {
  const { 
    tiktokProfile, 
    isLoading, 
    isConnecting, 
    connectTikTok, 
    disconnectTikTok,
    showReconnectDialog,
    previousTikTokInfo,
    handleReconnectSameAccount,
    handleConnectDifferentAccount,
    handleCancelReconnect
  } = useTikTokConnection();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = tiktokProfile?.tiktok_connected;

  return (
    <>
      <Card className={`border-2 hover:shadow-lg transition-shadow ${isConnected ? 'border-green-200 bg-green-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-600' : 'bg-black'}`}>
              <TikTokIcon className="h-6 w-6 text-white" size={24} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {t('dashboard.tiktok.title')}
                {isConnected && <CheckCircle className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? t('dashboard.tiktok.connectedAs', { username: tiktokProfile.tiktok_username || 'TikTok User' })
                  : t('dashboard.tiktok.readyToConnect')
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={tiktokProfile.tiktok_avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    <TikTokIcon className="h-5 w-5" size={20} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{tiktokProfile.tiktok_username || 'TikTok User'}</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.tiktok.connectedStatus')}</p>
                </div>
              </div>
              
              <Button 
                onClick={disconnectTikTok}
                variant="outline"
                className="w-full"
              >
                {t('dashboard.tiktok.disconnect')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                  <TikTokIcon className="h-6 w-6 text-white" size={24} />
                </div>
              </div>
              
              <Button 
                onClick={() => connectTikTok()}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('dashboard.tiktok.connecting')}
                  </>
                ) : (
                  <>
                    <TikTokIcon className="mr-2 h-4 w-4" size={16} />
                    {t('dashboard.tiktok.connect')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconnection Dialog */}
      <Dialog open={showReconnectDialog} onOpenChange={handleCancelReconnect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TikTokIcon className="h-5 w-5" size={20} />
              {t('dashboard.tiktok.reconnectTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.tiktok.reconnectDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {previousTikTokInfo && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border my-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={previousTikTokInfo.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">@{previousTikTokInfo.username || 'TikTok User'}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.tiktok.previousAccount')}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={handleReconnectSameAccount}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {t('dashboard.tiktok.reconnectSameAccount')}
            </Button>
            <Button 
              onClick={handleConnectDifferentAccount}
              variant="outline"
              className="w-full"
            >
              {t('dashboard.tiktok.connectDifferentAccount')}
            </Button>
            <Button 
              onClick={handleCancelReconnect}
              variant="ghost"
              className="w-full"
            >
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TikTokConnection;
