
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tiktokConnected = searchParams.get('tiktok');
    const error = searchParams.get('error');

    if (error) {
      let errorMessage = t('tiktok.errors.general');
      
      switch (error) {
        case 'missing_parameters':
          errorMessage = t('tiktok.errors.missingParameters');
          break;
        case 'invalid_state':
          errorMessage = t('tiktok.errors.invalidState');
          break;
        case 'token_exchange_failed':
          errorMessage = t('tiktok.errors.tokenExchangeFailed');
          break;
        case 'invalid_token_response':
          errorMessage = t('tiktok.errors.invalidTokenResponse');
          break;
        case 'profile_update_failed':
          errorMessage = t('tiktok.errors.profileUpdateFailed');
          break;
        case 'internal_error':
          errorMessage = t('tiktok.errors.internalError');
          break;
      }

      toast({
        title: t('tiktok.connectionFailed'),
        description: errorMessage,
        variant: "destructive"
      });
      
      navigate('/user-dashboard?tab=overview');
      return;
    }

    if (tiktokConnected === 'connected') {
      toast({
        title: t('tiktok.connected'),
        description: t('tiktok.connectedDescription'),
      });
    }

    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      navigate('/user-dashboard?tab=overview');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, toast, searchParams]);

  const hasError = searchParams.get('error');
  const isConnected = searchParams.get('tiktok') === 'connected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="mb-4">
          {hasError ? (
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          ) : isConnected ? (
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
          ) : (
            <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
          )}
        </div>
        <h2 className={`text-xl font-semibold text-deep-blue dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {hasError 
            ? t('tiktok.connectionFailed') 
            : isConnected 
              ? t('tiktok.connectedSuccessfully') 
              : t('tiktok.processing')
          }
        </h2>
        <p className={`text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
          {hasError 
            ? t('tiktok.connectionError') 
            : t('tiktok.redirecting')
          }
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
