
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || !type) {
        setStatus('error');
        setErrorMessage('Invalid confirmation link. Missing token or type parameter.');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setErrorMessage(error.message || 'Failed to confirm email. The link may have expired.');
        } else if (data.user) {
          setStatus('success');
          toast({
            title: t('toast.emailConfirmed'),
            description: t('toast.emailConfirmedDesc')
          });
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        } else {
          setStatus('error');
          setErrorMessage('Email confirmation failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  const handleReturnHome = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue via-vibrant-purple to-electric-cyan flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 text-vibrant-purple animate-spin" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle className="text-2xl font-bold text-deep-blue dark:text-white">
            {status === 'loading' && 'Confirming Email'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {status === 'loading' && 'Please wait while we confirm your email address...'}
            {status === 'success' && 'Your email has been successfully confirmed. Redirecting you to the home page...'}
            {status === 'error' && 'We encountered an issue confirming your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Welcome to ThinkPost! You can now sign in to your account and start managing your restaurant's social media content.
              </AlertDescription>
            </Alert>
          )}

          {(status === 'error' || status === 'success') && (
            <Button
              onClick={handleReturnHome}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold"
            >
              Return to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
