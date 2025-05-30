
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center pt-16 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-primary/10 dark:bg-gradient-primary/20 px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-vibrant-purple dark:text-purple-400" />
            <span className="text-sm font-medium text-deep-blue dark:text-gray-300">AI-Powered Content Generation</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-deep-blue dark:text-white mb-6 animate-fade-in">
            Transform Your
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Content Strategy
            </span>
          </h1>

          {/* Slogan */}
          <div className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-6 animate-fade-in animate-delay-100">
            <div className="leading-relaxed">
              Post smarter.<br />
              <span className="ml-8">Reach further.</span><br />
              <span className="ml-16 bg-gradient-primary bg-clip-text text-transparent">AI will do.</span>
            </div>
          </div>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in animate-delay-200">
            Create engaging, high-quality content in seconds with our advanced AI platform. 
            Boost your productivity and never run out of ideas again.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in animate-delay-400">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 text-lg font-semibold group">
              Start Creating Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="border-deep-blue text-deep-blue dark:border-gray-600 dark:text-gray-300 hover:bg-deep-blue hover:text-white dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in animate-delay-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-deep-blue dark:text-white mb-2">10M+</div>
              <div className="text-gray-600 dark:text-gray-400">Content Pieces Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-deep-blue dark:text-white mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-deep-blue dark:text-white mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
