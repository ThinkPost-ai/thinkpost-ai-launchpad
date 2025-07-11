import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const TikTokCallback = () => {
  const { t } = useLanguage();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL with all parameters
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get('code');
        const state = currentUrl.searchParams.get('state');

        console.log('🔄 TikTok callback received on domain proxy:', { 
          code: !!code, 
          state: !!state,
          fullUrl: window.location.href,
          codeLength: code?.length,
          stateLength: state?.length
        });

        if (!code || !state) {
          console.error('❌ Missing code or state parameter');
          console.log('🔍 Available URL parameters:', Object.fromEntries(currentUrl.searchParams.entries()));
          window.location.href = '/tiktok-login-callback?error=missing_parameters';
          return;
        }

        // Get current session for authorization
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error('❌ No valid session found for callback:', sessionError);
          window.location.href = '/tiktok-login-callback?error=no_session';
          return;
        }

        console.log('✅ Valid session found for callback:', {
          userId: sessionData.session.user?.id,
          tokenLength: sessionData.session.access_token?.length
        });

        // Forward the request to the Supabase edge function
        const supabaseCallbackUrl = `https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/tiktok-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        
        console.log('🚀 Forwarding to Supabase edge function:', supabaseCallbackUrl);

        // Make the request to the Supabase edge function WITH AUTHORIZATION
        const response = await fetch(supabaseCallbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          }
        });

        console.log('📡 Supabase edge function response:', {
          status: response.status,
          statusText: response.statusText,
          redirected: response.redirected,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.redirected) {
          // If the edge function returned a redirect, follow it
          console.log('✅ Following redirect to:', response.url);
          window.location.href = response.url;
        } else if (response.ok) {
          // If successful but no redirect, go to success page
          console.log('✅ Success response, going to success page');
          const responseText = await response.text();
          console.log('📥 Response body:', responseText);
          window.location.href = '/tiktok-login-callback?tiktok=connected';
        } else {
          // If there was an error, go to error page
          console.error('❌ Supabase edge function error:', response.status, response.statusText);
          
          try {
            const errorText = await response.text();
            console.error('❌ Error response body:', errorText);
          } catch (e) {
            console.error('❌ Could not read error response body:', e);
          }
          
          window.location.href = '/tiktok-login-callback?error=callback_failed';
        }

      } catch (error) {
        console.error('💥 Error in TikTok callback proxy:', error);
        console.error('💥 Error stack:', error.stack);
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
          {t('dashboard.tiktok.processingConnection')}
        </h2>
        <p className="text-muted-foreground">
          {t('dashboard.tiktok.processingConnectionDescription')}
        </p>
      </div>
    </div>
  );
};

export default TikTokCallback;
