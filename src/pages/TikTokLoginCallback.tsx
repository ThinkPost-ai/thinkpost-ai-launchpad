
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('TikTok Login callback received');
      
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('TikTok Login OAuth error:', error, errorDescription);
        toast({
          title: "TikTok Login Failed",
          description: `${error}: ${errorDescription || 'Unknown error'}`,
          variant: "destructive"
        });
        navigate('/user-dashboard');
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        toast({
          title: "TikTok Login Failed", 
          description: "Missing authorization parameters",
          variant: "destructive"
        });
        navigate('/user-dashboard');
        return;
      }

      // Wait for auth to be loaded if it's still loading
      if (authLoading) {
        console.log('Waiting for auth to load...');
        return;
      }

      if (!session?.access_token) {
        console.error('No user session available');
        // Store the callback parameters and redirect to login
        localStorage.setItem('tiktok_login_callback_code', code);
        localStorage.setItem('tiktok_login_callback_state', state);
        
        toast({
          title: "Authentication Required",
          description: "Please log in to connect your TikTok account",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        console.log('Processing TikTok Login callback with code:', code);
        
        // Call our edge function to handle the token exchange
        const { data, error: functionError } = await supabase.functions.invoke('tiktok-login-callback', {
          body: { code, state },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        console.log('TikTok Login connection successful:', data);
        
        toast({
          title: "TikTok Connected!",
          description: `Successfully connected your TikTok account via Login Kit`,
        });
        
        navigate('/user-dashboard');
        
      } catch (error: any) {
        console.error('Error processing TikTok Login callback:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to complete TikTok Login connection",
          variant: "destructive"
        });
        navigate('/user-dashboard');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, session, authLoading, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {processing ? 'Connecting TikTok Account via Login Kit...' : 'Processing Complete'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we complete your TikTok Login Kit connection
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
