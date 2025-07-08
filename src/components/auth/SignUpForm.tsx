import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface SignUpFormProps {
  onSuccess?: () => void;
}

const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const [signupError, setSignupError] = useState('');
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Validate password and set error message
    const error = validatePassword(newPassword);
    setPasswordError(error);
    
    // Check password match if confirm password is already filled
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError('Passwords do not match');
    } else {
      setPasswordMatchError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Check if passwords match
    if (password && password !== newConfirmPassword) {
      setPasswordMatchError('Passwords do not match');
    } else {
      setPasswordMatchError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(''); // Clear previous errors
    
    console.log('🚀 Starting signup process...', {
      name,
      email,
      passwordLength: password.length,
      hasConfirmPassword: !!confirmPassword
    });
    
    // Validate password before submission
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      console.error('❌ Password validation failed:', passwordValidationError);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      console.error('❌ Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('📡 Calling signUp function...');
      const { error } = await signUp(email, password, name);
      
      console.log('📡 SignUp response:', { error });
      
      if (error) {
        console.error('❌ Signup error:', error);
        setSignupError(error.message || 'Failed to create account');
      } else {
        console.log('✅ Signup successful! User should be logged in.');
        // User is now automatically signed in, close the dialog
        onSuccess?.();
        // Small delay to ensure auth state is updated before navigation
        setTimeout(() => {
          navigate('/home');
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Unexpected signup error:', error);
      setSignupError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-deep-blue dark:text-white">
          {t('auth.joinThinkPost')}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {t('auth.createAccountToStart')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-deep-blue dark:text-white font-medium">
              {t('auth.fullName')}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t('auth.enterFullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
            />
          </div>

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
                placeholder={t('auth.createStrongPassword')}
                value={password}
                onChange={handlePasswordChange}
                required
                className={`border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 pr-10 ${
                  passwordError ? 'border-red-500 dark:border-red-400' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {passwordError}
              </p>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Password must be at least 8 characters with one uppercase and one lowercase letter
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-deep-blue dark:text-white font-medium">
              {t('auth.confirmPassword')}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.confirmYourPassword')}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                className={`border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 pr-10 ${
                  passwordMatchError ? 'border-red-500 dark:border-red-400' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordMatchError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {passwordMatchError}
              </p>
            )}
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 pt-2">
            {t('auth.agreeToTerms')}{' '}
            <a 
              href="https://thinkpost.co/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              {t('auth.termsOfService')}
            </a>{' '}
            {t('auth.and')}{' '}
            <a 
              href="https://thinkpost.co/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              {t('auth.privacyPolicy')}
            </a>
          </div>

          {signupError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {signupError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !!passwordError || !!passwordMatchError}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-2.5 mt-6"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              t('auth.createAccount')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
