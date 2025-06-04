
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Pricing = () => {
  const { t, isRTL } = useLanguage();

  const plans = [
    {
      name: t('pricing.plans.free.name'),
      price: '$0',
      period: t('pricing.plans.free.period'),
      description: t('pricing.plans.free.description'),
      icon: Rocket,
      features: [
        t('pricing.plans.free.features.posts'),
        t('pricing.plans.free.features.captions'),
        t('pricing.plans.free.features.platforms'),
        t('pricing.plans.free.features.support'),
        t('pricing.plans.free.features.templates')
      ],
      buttonText: t('pricing.plans.free.buttonText'),
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: t('pricing.plans.pro.name'),
      price: '$29',
      period: t('pricing.plans.pro.period'),
      description: t('pricing.plans.pro.description'),
      icon: Sparkles,
      features: [
        t('pricing.plans.pro.features.posts'),
        t('pricing.plans.pro.features.captions'),
        t('pricing.plans.pro.features.platforms'),
        t('pricing.plans.pro.features.support'),
        t('pricing.plans.pro.features.templates'),
        t('pricing.plans.pro.features.analytics'),
        t('pricing.plans.pro.features.scheduling'),
        t('pricing.plans.pro.features.arabic')
      ],
      buttonText: t('pricing.plans.pro.buttonText'),
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      name: t('pricing.plans.business.name'),
      price: '$99',
      period: t('pricing.plans.business.period'),
      description: t('pricing.plans.business.description'),
      icon: Crown,
      features: [
        t('pricing.plans.business.features.posts'),
        t('pricing.plans.business.features.captions'),
        t('pricing.plans.business.features.platforms'),
        t('pricing.plans.business.features.support'),
        t('pricing.plans.business.features.branding'),
        t('pricing.plans.business.features.analytics'),
        t('pricing.plans.business.features.collaboration'),
        t('pricing.plans.business.features.api'),
        t('pricing.plans.business.features.whiteLabel'),
        t('pricing.plans.business.features.integrations')
      ],
      buttonText: t('pricing.plans.business.buttonText'),
      buttonVariant: 'outline' as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue dark:text-white mb-6">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in dark:bg-gray-800 ${
                plan.popular ? 'ring-2 ring-vibrant-purple' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-6 py-2 rounded-full text-sm font-semibold">
                  {t('pricing.mostPopular')}
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
                  plan.popular ? 'bg-gradient-primary' : 'bg-gray-100 dark:bg-gray-700'
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className={`h-8 w-8 ${plan.popular ? 'text-white' : 'text-vibrant-purple'}`} />
                </div>
                <h3 className="text-2xl font-bold text-deep-blue dark:text-white">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                <div className="flex items-baseline justify-center mt-4">
                  <span className="text-4xl font-bold text-deep-blue dark:text-white">{plan.price}</span>
                  <span className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-center ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                      <Check className={`h-5 w-5 text-green-500 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.buttonVariant}
                  className={`w-full py-3 font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90 text-white' 
                      : plan.buttonVariant === 'outline'
                      ? 'border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-deep-blue'
                      : ''
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise section */}
        <div className="mt-16 text-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-deep-blue dark:text-white mb-4">
              {t('pricing.enterprise.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('pricing.enterprise.description')}
            </p>
            <Button variant="outline" className="border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-deep-blue">
              {t('pricing.enterprise.buttonText')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
