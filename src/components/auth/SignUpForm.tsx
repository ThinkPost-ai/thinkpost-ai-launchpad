import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface SignUpFormProps {
  onSuccess?: () => void;
}

interface PasswordRequirement {
  key: string;
  label: string;
  isValid: boolean;
}

const PasswordRequirements = ({ password }: { password: string }) => {
  const { t, isRTL } = useLanguage();
  
  const requirements: PasswordRequirement[] = [
    {
      key: 'length',
      label: t('auth.passwordMinLength'),
      isValid: password.length >= 8
    },
    {
      key: 'uppercase',
      label: t('auth.passwordUppercase'),
      isValid: /[A-Z]/.test(password)
    },
    {
      key: 'lowercase',
      label: t('auth.passwordLowercase'),
      isValid: /[a-z]/.test(password)
    }
  ];

  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('auth.passwordRequirements')}
      </p>
      <div className="space-y-1">
        {requirements.map((req) => (
          <div 
            key={req.key} 
            className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {req.isValid ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            <span 
              className={`${
                req.isValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              } ${isRTL ? 'text-right' : 'text-left'}`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password)
    ];
    
    return requirements.every(req => req) ? '' : t('auth.passwordRequirementsNotMet');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Validate password and set error message
    const error = validatePassword(newPassword);
    setPasswordError(error);
    
    // Check password match if confirm password is already filled
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError(t('auth.passwordsDoNotMatch'));
    } else {
      setPasswordMatchError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Check if passwords match
    if (password && password !== newConfirmPassword) {
      setPasswordMatchError(t('auth.passwordsDoNotMatch'));
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
      setPasswordMatchError(t('auth.passwordsDoNotMatch'));
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
        
        // Handle special case where account was created but auto sign-in failed
        if (error.message === 'ACCOUNT_CREATED_SIGNIN_REQUIRED') {
          // Account was created successfully, but user needs to sign in manually
          onSuccess?.();
          return;
        }
        
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
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-deep-blue dark:text-white">
          {t('auth.joinThinkPost')}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
          {t('auth.createAccountToStart')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
            <PasswordRequirements password={password} />
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

          <div className="text-xs text-gray-600 dark:text-gray-400 pt-1 leading-relaxed">
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
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3 mt-4 min-h-[44px] text-base"
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
      {/* Add extra bottom padding on mobile to ensure button visibility */}
      <div className="pb-4 sm:pb-0"></div>
    </Card>
  );
};

export default SignUpForm;
