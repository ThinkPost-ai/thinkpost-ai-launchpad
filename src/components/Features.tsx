
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Zap, Target, Shield, Globe, Rocket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Features = () => {
  const { t, isRTL } = useLanguage();
  
  const features = [
    {
      icon: Bot,
      title: t('features.feature1.title'),
      description: t('features.feature1.description')
    },
    {
      icon: Zap,
      title: t('features.feature2.title'),
      description: t('features.feature2.description')
    },
    {
      icon: Target,
      title: t('features.feature3.title'),
      description: t('features.feature3.description')
    },
    {
      icon: Shield,
      title: t('features.feature4.title'),
      description: t('features.feature4.description')
    },
    {
      icon: Globe,
      title: t('features.feature5.title'),
      description: t('features.feature5.description')
    },
    {
      icon: Rocket,
      title: t('features.feature6.title'),
      description: t('features.feature6.description')
    }
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-deep-blue dark:text-white mb-6">
            {t('features.title.powerful')} 
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              {t('features.title.creators')}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('features.description')}
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
