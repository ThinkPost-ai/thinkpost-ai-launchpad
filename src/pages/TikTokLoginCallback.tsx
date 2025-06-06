
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: "Connection Failed",
          description: "TikTok connection was cancelled or failed.",
          variant: "destructive"
        });
        navigate('/user-dashboard?tab=overview');
        return;
      }

      if (!code || !state) {
        toast({
          title: "Connection Failed",
          description: "Invalid callback parameters.",
          variant: "destructive"
        });
        navigate('/user-dashboard?tab=overview');
        return;
      }

      // The callback will be handled by the edge function
      // This page is just for the brief moment while processing
      toast({
        title: "Success!",
        description: "TikTok account connected successfully.",
      });
      navigate('/user-dashboard?tab=overview');
    };

    processCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-vibrant-purple" />
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          Connecting TikTok Account
        </h2>
        <p className="text-muted-foreground">
          Please wait while we connect your TikTok account...
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
