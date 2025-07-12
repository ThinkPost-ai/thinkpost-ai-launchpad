import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

const AuthDialog = ({ isOpen, onClose, defaultTab = 'signin' }: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    onClose();
    // Navigate to dashboard after successful authentication
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-h-[90vh] max-h-[90dvh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full mx-4 my-4 sm:mx-auto sm:my-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {activeTab === 'signin' ? t('auth.signIn') : t('auth.signUp')} to ThinkPost
          </DialogTitle>
          <DialogDescription className="sr-only">
            {activeTab === 'signin' 
              ? t('auth.signInToAccount')
              : 'Create a new ThinkPost account to start managing your social media content with AI assistance.'
            }
          </DialogDescription>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
              alt="ThinkPost Logo" 
              className="h-8 w-8"
            />
            <span className="text-lg font-bold text-deep-blue dark:text-white">ThinkPost</span>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <Button
            variant={activeTab === 'signin' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('signin')}
            className={`flex-1 ${
              activeTab === 'signin' 
                ? 'bg-white dark:bg-gray-700 text-deep-blue dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-deep-blue dark:hover:text-white'
            }`}
          >
            {t('auth.signIn')}
          </Button>
          <Button
            variant={activeTab === 'signup' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('signup')}
            className={`flex-1 ${
              activeTab === 'signup' 
                ? 'bg-white dark:bg-gray-700 text-deep-blue dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-deep-blue dark:hover:text-white'
            }`}
          >
            {t('auth.signUp')}
          </Button>
        </div>

        {/* Forms */}
        {activeTab === 'signin' ? (
          <SignInForm onSuccess={handleAuthSuccess} />
        ) : (
          <SignUpForm onSuccess={handleAuthSuccess} />
        )}

        {/* Switch between forms */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
          {activeTab === 'signin' ? (
            <>
              {t('auth.dontHaveAccount')}{' '}
              <button
                onClick={() => setActiveTab('signup')}
                className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                {t('auth.signUp')}
              </button>
            </>
          ) : (
            <>
              {t('auth.alreadyHaveAccount')}{' '}
              <button
                onClick={() => setActiveTab('signin')}
                className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                {t('auth.signIn')}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
