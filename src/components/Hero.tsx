import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
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

    // Always navigate to user-dashboard directly
    navigate('/user-dashboard');
  };

  const getButtonText = () => {
    if (!user) return t('hero.startCreating');
    if (loading) return t('hero.loading');
    return t('hero.goToDashboard');
  };

  return (
    <>
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className={`text-${isRTL ? 'right' : 'left'}`}>
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

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-lg leading-relaxed">
                {t('hero.description')}
              </p>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-16 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-auto font-medium"
                  onClick={handleStartCreating}
                  disabled={loading}
                >
                  {getButtonText()}
                  <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-deep-blue dark:text-white border-2 border-deep-blue dark:border-white hover:bg-deep-blue hover:text-white dark:hover:bg-white dark:hover:text-deep-blue text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-auto font-medium"
                >
                  {t('hero.watchDemo')}
                </Button>
              </div>
            </div>

            {/* Right Content - Video Section */}
            <div className="flex flex-col items-center justify-center h-full order-first lg:order-last">
              <div className="relative">
                {/* Responsive Video Placeholder */}
                <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-vibrant-purple to-deep-blue rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Play Button */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer">
                    <Play className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white ${isRTL ? 'mr-1' : 'ml-1'}`} />
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-6 sm:top-8 left-6 sm:left-8 w-2 h-2 sm:w-3 sm:h-3 bg-white/30 rounded-full"></div>
                  <div className="absolute top-6 sm:top-8 left-12 sm:left-16 w-2 h-2 sm:w-3 sm:h-3 bg-white/20 rounded-full"></div>
                  <div className="absolute top-6 sm:top-8 left-18 sm:left-24 w-2 h-2 sm:w-3 sm:h-3 bg-white/20 rounded-full"></div>
                </div>
              </div>
              
              {/* Video Description */}
              <div className="text-center mt-6 sm:mt-8 px-4">
                <h3 className="text-lg sm:text-xl font-semibold text-deep-blue dark:text-white mb-2">
                  {t('hero.demoTitle')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {t('hero.demoDescription')}
                </p>
              </div>
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
