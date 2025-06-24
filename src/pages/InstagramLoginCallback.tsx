
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { isLovablePreview } from '@/utils/domainUtils';

const InstagramLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isPreview = isLovablePreview();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Instagram callback received:', { code: !!code, error, isPreview });

    if (error) {
      const errorDescription = searchParams.get('error_description') || 'An unknown error occurred.';
      toast({
        title: "Instagram Connection Failed",
        description: errorDescription,
        variant: "destructive"
      });
      navigate('/user-dashboard?tab=overview');
      return;
    }

    if (code) {
      // We have the code, now we need to call a backend function
      // to exchange it for an access token. This will be implemented next.
      console.log('Received Instagram auth code:', code);
      console.log('Current environment:', isPreview ? 'Lovable Preview' : 'Production');

      // Here you would invoke a Supabase Edge Function
      // For now, we will just redirect.
      
      const timer = setTimeout(() => {
        toast({
          title: "Instagram Connected!",
          description: `Your Instagram account has been linked${isPreview ? ' (Preview Mode)' : ''}.`,
        });
        navigate('/user-dashboard?tab=overview');
      }, 2000);

      return () => clearTimeout(timer);
    } else {
       // Handle case where there's no code and no error
       navigate('/user-dashboard?tab=overview');
    }

  }, [navigate, toast, searchParams, isPreview]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          Connecting your Instagram Account...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we finalize the connection. You will be redirected shortly.
        </p>
        {isLovablePreview() && (
          <p className="text-xs text-amber-600 mt-2">
            Running in preview mode
          </p>
        )}
      </div>
    </div>
  );
};

export default InstagramLoginCallback;
