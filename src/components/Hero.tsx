
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthDialog from '@/components/auth/AuthDialog';

const Hero = () => {
  const { user, loading } = useAuth();
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

    // Always navigate to dashboard which will handle the redirection
    navigate('/dashboard');
  };

  const getButtonText = () => {
    if (!user) return 'Start Creating Free';
    if (loading) return 'Loading...';
    return 'Go to Dashboard';
  };

  return (
    <>
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-gray-200 dark:border-gray-700">
                <Sparkles className="h-4 w-4 text-vibrant-purple" />
                <span className="text-sm font-medium text-deep-blue dark:text-white">AI-Powered Content Generation</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-blue dark:text-white mb-6 leading-tight">
                Transform Your
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">Content Strategy</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 font-medium">
                Post smarter. Reach further. AI will do.
              </p>

              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg leading-relaxed">
                Create engaging, high-quality content in seconds with our advanced AI platform. Boost 
                your productivity and never run out of ideas again.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 text-white text-lg px-8 py-4 h-auto"
                  onClick={handleStartCreating}
                  disabled={loading}
                >
                  {getButtonText()}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-deep-blue dark:text-white border-2 border-deep-blue dark:border-white hover:bg-deep-blue hover:text-white dark:hover:bg-white dark:hover:text-deep-blue text-lg px-8 py-4 h-auto"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-deep-blue dark:text-white mb-1">10M+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Content Pieces Generated</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-deep-blue dark:text-white mb-1">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Happy Users</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-deep-blue dark:text-white mb-1">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Content - Video Section */}
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                {/* Large Square Video Placeholder */}
                <div className="w-96 h-96 lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-vibrant-purple to-deep-blue rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Play Button */}
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-8 left-8 w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="absolute top-8 left-16 w-3 h-3 bg-white/20 rounded-full"></div>
                  <div className="absolute top-8 left-24 w-3 h-3 bg-white/20 rounded-full"></div>
                </div>
              </div>
              
              {/* Video Description */}
              <div className="text-center mt-8">
                <h3 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">Demo Video Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  See our AI in action
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
