
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast({
        title: "TikTok Connection Failed",
        description: "There was an error connecting your TikTok account.",
        variant: "destructive"
      });
      navigate('/user-dashboard?tab=overview');
      return;
    }

    if (code && state) {
      // The callback is handled by the edge function
      // This page is mainly for handling client-side errors and redirects
      toast({
        title: "TikTok Connected!",
        description: "Your TikTok account has been connected successfully.",
      });
    }

    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      navigate('/user-dashboard?tab=overview');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, toast, searchParams]);

  const hasError = searchParams.get('error');
  const hasCode = searchParams.get('code');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          {hasError ? (
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          ) : hasCode ? (
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
          ) : (
            <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          {hasError 
            ? 'Connection Failed' 
            : hasCode 
              ? 'TikTok Connected Successfully!' 
              : 'Processing TikTok Connection...'
          }
        </h2>
        <p className="text-muted-foreground">
          {hasError 
            ? 'There was an error connecting your TikTok account.' 
            : 'Redirecting to your dashboard...'
          }
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
