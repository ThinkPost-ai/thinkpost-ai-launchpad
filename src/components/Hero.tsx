import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthDialog from '@/components/auth/AuthDialog';

const Hero = () => {
  const { user, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleStartCreating = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }

    if (loading) {
      return; // Wait for auth to complete
    }

    // Navigate to dashboard which will handle brand setup flow
    navigate('/dashboard');
  };

  const getButtonText = () => {
    if (!user) return t('hero.startCreating');
    if (loading) return t('hero.loading');
    return t('hero.goToDashboard');
  };

  return (
    <>
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-vibrant-purple" />
              <span className="text-xs sm:text-sm font-medium text-deep-blue dark:text-white">
                {t('hero.badge')}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-deep-blue dark:text-white mb-4 sm:mb-6 leading-tight">
              {t('hero.title.transform')}
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent dark:text-pink-400">
                {t('hero.title.contentStrategy')}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 font-medium">
              {t('hero.subtitle')}
            </p>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('hero.description')}
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-auto font-medium"
                onClick={handleStartCreating}
                disabled={loading}
              >
                {getButtonText()}
                <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        defaultTab="signup"
      />
    </>
  );
};

export default Hero;
