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
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-deep-blue dark:text-white mb-4 sm:mb-6 leading-tight">
            {t('features.title.powerful')} 
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              {t('features.title.creators')}
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('features.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-deep-blue dark:text-white leading-tight">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
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
