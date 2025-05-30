
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const Hero = () => {
  return (
    <section className="pt-24 pb-12 lg:pt-32 lg:pb-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-blue leading-tight">
                Create Less.{' '}
                <span className="bg-gradient-to-r from-vibrant-purple to-deep-blue bg-clip-text text-transparent">
                  Achieve More.
                </span>
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-600 font-medium">
                Let AI Handle Your Social Media.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Upload content, generate captions, and post — across all platforms, in seconds.
                Perfect for restaurants, local businesses, and anyone who wants to dominate social media.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 text-lg font-semibold group"
              >
                Try Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white px-8 py-4 text-lg font-semibold group"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-deep-blue">10K+</div>
                <div className="text-sm text-gray-600">Posts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-deep-blue">500+</div>
                <div className="text-sm text-gray-600">Happy Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-deep-blue">95%</div>
                <div className="text-sm text-gray-600">Time Saved</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-scale-in animate-delay-400">
            <div className="relative bg-gradient-primary rounded-2xl p-8 shadow-2xl animate-float">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-sm">AI Content Preview</div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-blue-100 rounded px-3 flex items-center">
                      <span className="text-xs text-blue-600">Instagram</span>
                    </div>
                    <div className="h-8 bg-pink-100 rounded px-3 flex items-center">
                      <span className="text-xs text-pink-600">TikTok</span>
                    </div>
                    <div className="h-8 bg-blue-100 rounded px-3 flex items-center">
                      <span className="text-xs text-blue-800">Facebook</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-vibrant-purple text-white p-3 rounded-full shadow-lg animate-float">
              ✨
            </div>
            <div className="absolute -bottom-4 -left-4 bg-deep-blue text-white p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '1s' }}>
              🚀
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
