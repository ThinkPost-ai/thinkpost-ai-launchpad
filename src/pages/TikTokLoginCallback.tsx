
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tiktokConnected = searchParams.get('tiktok');
    const error = searchParams.get('error');

    if (error) {
      let errorMessage = "There was an error connecting your TikTok account.";
      
      switch (error) {
        case 'missing_parameters':
          errorMessage = "Missing required parameters from TikTok.";
          break;
        case 'invalid_state':
          errorMessage = "Invalid or expired authorization state.";
          break;
        case 'token_exchange_failed':
          errorMessage = "Failed to exchange authorization code for access token.";
          break;
        case 'invalid_token_response':
          errorMessage = "Invalid response from TikTok's token service.";
          break;
        case 'profile_update_failed':
          errorMessage = "Failed to update your profile with TikTok information.";
          break;
        case 'internal_error':
          errorMessage = "An internal error occurred during the connection process.";
          break;
      }

      toast({
        title: t('dashboard.tiktok.connectionFailed'),
        description: errorMessage,
        variant: "destructive"
      });
      
      navigate('/user-dashboard?tab=overview');
      return;
    }

    if (tiktokConnected === 'connected') {
      toast({
        title: t('dashboard.tiktok.connectionSuccess'),
        description: t('dashboard.tiktok.connectionSuccessDescription'),
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
      <div className="text-center">
        <div className="mb-4">
          {hasError ? (
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          ) : isConnected ? (
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
          ) : (
            <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          {hasError 
            ? t('dashboard.tiktok.connectionFailedPageTitle')
            : isConnected 
              ? t('dashboard.tiktok.connectionSuccessPageTitle')
              : t('dashboard.tiktok.processingConnection')
          }
        </h2>
        <p className="text-muted-foreground">
          {hasError 
            ? t('dashboard.tiktok.connectionFailedPageDescription')
            : t('dashboard.tiktok.redirectingToDashboard')
          }
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
