
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Zap, Target, Shield, Globe, Rocket } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Generation",
      description: "Advanced algorithms create human-like content tailored to your brand voice and style."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate high-quality content in seconds, not hours. Boost your productivity instantly."
    },
    {
      icon: Target,
      title: "Targeted Content",
      description: "Create content optimized for your specific audience and marketing goals."
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Built-in quality checks ensure your content meets the highest standards."
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Generate content in over 50 languages to reach a global audience."
    },
    {
      icon: Rocket,
      title: "SEO Optimized",
      description: "Content automatically optimized for search engines to boost your rankings."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-deep-blue dark:text-white mb-6">
            Powerful Features for 
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Content Creators
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to create, optimize, and scale your content strategy with the power of AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-deep-blue dark:text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
