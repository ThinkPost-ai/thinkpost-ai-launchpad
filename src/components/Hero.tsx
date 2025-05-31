
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthDialog from '@/components/auth/AuthDialog';

const Hero = () => {
  const { user, hasRestaurant, checkingProfile } = useAuth();
  const navigate = useNavigate();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleStartCreating = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }

    if (checkingProfile) {
      return; // Wait for profile check to complete
    }

    if (hasRestaurant) {
      navigate('/user-dashboard');
    } else {
      navigate('/restaurant-setup');
    }
  };

  const getButtonText = () => {
    if (!user) return 'Start Creating Free';
    if (checkingProfile) return 'Loading...';
    return 'Go to Dashboard';
  };

  return (
    <>
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto text-center max-w-6xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-gray-200 dark:border-gray-700">
            <Sparkles className="h-4 w-4 text-vibrant-purple" />
            <span className="text-sm font-medium text-deep-blue dark:text-white">AI-Powered Content Creation</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-deep-blue dark:text-white mb-6 leading-tight">
            Create Viral
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Arabic </span>
            Content for Your Restaurant
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your food photos and get AI-generated Arabic captions tailored for Saudi culture. 
            Boost your social media presence with authentic, engaging content that resonates with your audience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-4 h-auto"
              onClick={handleStartCreating}
              disabled={checkingProfile}
            >
              {getButtonText()}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-deep-blue dark:text-white border-2 border-deep-blue dark:border-white hover:bg-deep-blue hover:text-white dark:hover:bg-white dark:hover:text-deep-blue text-lg px-8 py-4 h-auto"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Hero Video Section */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 border border-gray-200 dark:border-gray-700">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-vibrant-purple to-deep-blue">
                {/* Video placeholder with play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer">
                      <Play className="h-8 w-8 ml-1" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">See ThinkPost.ai in Action</h3>
                    <p className="text-white/80 max-w-md">
                      Watch how easy it is to transform your food photos into engaging Arabic content
                    </p>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="absolute top-4 left-12 w-3 h-3 bg-white/20 rounded-full"></div>
                <div className="absolute top-4 left-20 w-3 h-3 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-gray-500 dark:text-gray-400 text-sm mt-12">
            Trusted by 500+ restaurants across Saudi Arabia
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
