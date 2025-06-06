
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTikTokAuth } from '@/hooks/useTikTokAuth';

const TikTokCallback = () => {
  const navigate = useNavigate();
  const { loading } = useTikTokAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      console.log('TikTok callback page loaded');
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      console.log('Callback parameters:', { code: !!code, state: !!state, error });
      
      if (error) {
        console.error('TikTok OAuth error:', error);
        navigate('/?error=tiktok_auth_failed');
        return;
      }
      
      if (code && state) {
        // Store parameters for processing by the auth hook
        localStorage.setItem('tiktok_callback_code', code);
        localStorage.setItem('tiktok_callback_state', state);
        
        // Check what mode we're in
        const authMode = localStorage.getItem('tiktok_auth_mode');
        const storedState = localStorage.getItem(authMode === 'login' ? 'tiktok_auth_state' : 'tiktok_oauth_state');
        
        if (state !== storedState) {
          console.error('State mismatch - possible CSRF attack');
          localStorage.removeItem('tiktok_callback_code');
          localStorage.removeItem('tiktok_callback_state');
          navigate('/?error=invalid_state');
          return;
        }
        
        console.log('Parameters stored, redirecting to appropriate page...');
        
        // Redirect based on mode
        if (authMode === 'login') {
          navigate('/'); // Will be processed by useTikTokAuth hook
        } else {
          navigate('/dashboard'); // Will be processed by useTikTokConnectionData hook
        }
      } else {
        console.error('Missing required parameters');
        navigate('/?error=missing_parameters');
      }
    };
    
    processCallback();
  }, [navigate]);

  if (processing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-purple mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Processing TikTok Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we complete your sign-in...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default TikTokCallback;
