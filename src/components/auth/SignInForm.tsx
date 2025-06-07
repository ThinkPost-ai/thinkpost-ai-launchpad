import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignInFormProps {
  onSuccess?: () => void;
}

const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const { signIn } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsEmailConfirmation(false);
    
    const { error: signInError } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        setNeedsEmailConfirmation(true);
        setError(t('auth.checkEmailConfirmation'));
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(signInError.message);
      }
    } else {
      onSuccess?.();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-deep-blue dark:text-white">
          {t('auth.welcomeBack')}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {t('auth.signInToAccount')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant={needsEmailConfirmation ? "default" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {needsEmailConfirmation && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>{t('auth.emailConfirmationRequired')}</strong> {t('auth.checkEmailConfirmation')}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-deep-blue dark:text-white font-medium">
              {t('auth.email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-deep-blue dark:text-white font-medium">
              {t('auth.password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <a 
              href="#" 
              className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              {t('auth.forgotPassword')}
            </a>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-2.5"
          >
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
