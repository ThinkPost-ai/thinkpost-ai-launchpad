
import { Upload, Sparkles, Share2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Features = () => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Media',
      description: 'Drag and drop your photos and videos. We support all major formats and automatically optimize for each platform.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Sparkles,
      title: 'Smart Caption Generation',
      description: 'Our AI creates engaging captions tailored to each platform, with perfect tone and hashtags.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Share2,
      title: 'Post Across Platforms',
      description: 'Publish to Instagram, TikTok, Facebook, X, and more with one click. Schedule for optimal engagement.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Globe,
      title: 'Arabic & Saudi Dialect Support',
      description: 'Perfect cultural tone and local dialect understanding for Arabic content and Saudi market.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-vibrant-purple to-deep-blue bg-clip-text text-transparent">
              Dominate Social Media
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Streamline your content creation process with AI-powered tools designed for modern businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-deep-blue mb-3 group-hover:text-vibrant-purple transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature highlight */}
        <div className="mt-20 bg-gradient-primary rounded-2xl p-8 md:p-12 text-white animate-fade-in">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Built for Local Businesses
              </h3>
              <p className="text-lg opacity-90 mb-6">
                Especially powerful for restaurants and local businesses in Saudi Arabia. 
                Our AI understands cultural nuances and creates content that resonates with your audience.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Restaurant Menus</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Local Events</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Cultural Content</span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Arabic Hashtags</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-4xl mb-4">🇸🇦</div>
                <div className="text-lg font-semibold">Native Arabic Support</div>
                <div className="text-sm opacity-80 mt-2">Perfect for Saudi businesses</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
