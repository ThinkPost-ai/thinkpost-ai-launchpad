
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const InstagramLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

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
      handleInstagramCallback(code, state);
    } else {
      navigate('/user-dashboard?tab=overview');
    }
  }, [navigate, toast, searchParams]);

  const handleInstagramCallback = async (code: string, state: string | null) => {
    try {
      console.log('Processing Instagram callback with code:', code);
      
      // Get current user session to include authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('instagram-oauth-callback', {
        body: { code, state },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to connect Instagram');
      }

      if (data.success) {
        toast({
          title: "Instagram Connected!",
          description: `Your Instagram account @${data.username} has been connected successfully.`,
        });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Instagram callback error:', error);
      toast({
        title: "Instagram Connection Failed",
        description: error.message || 'Failed to connect your Instagram account',
        variant: "destructive"
      });
    } finally {
      // Always redirect to dashboard
      setTimeout(() => {
        navigate('/user-dashboard?tab=overview');
      }, 2000);
    }
  };

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
      </div>
    </div>
  );
};

export default InstagramLoginCallback;
