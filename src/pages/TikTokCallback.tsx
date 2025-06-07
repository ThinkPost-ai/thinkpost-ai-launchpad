
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const TikTokCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL with all parameters
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get('code');
        const state = currentUrl.searchParams.get('state');

        console.log('TikTok callback received on domain proxy:', { code: !!code, state: !!state });

        if (!code || !state) {
          console.error('Missing code or state parameter');
          window.location.href = '/tiktok-login-callback?error=missing_parameters';
          return;
        }

        // Forward the request to the Supabase edge function
        const supabaseCallbackUrl = `https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        
        console.log('Forwarding to Supabase edge function:', supabaseCallbackUrl);

        // Make the request to the Supabase edge function
        const response = await fetch(supabaseCallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Supabase edge function response status:', response.status);

        if (response.redirected) {
          // If the edge function returned a redirect, follow it
          window.location.href = response.url;
        } else if (response.ok) {
          // If successful but no redirect, go to success page
          window.location.href = '/tiktok-login-callback?tiktok=connected';
        } else {
          // If there was an error, go to error page
          console.error('Supabase edge function error:', response.status, response.statusText);
          window.location.href = '/tiktok-login-callback?error=callback_failed';
        }

      } catch (error) {
        console.error('Error in TikTok callback proxy:', error);
        window.location.href = '/tiktok-login-callback?error=proxy_error';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          Processing TikTok Connection...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we complete your TikTok login.
        </p>
      </div>
    </div>
  );
};

export default TikTokCallback;
