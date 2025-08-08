import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const plans = [
    {
      id: 'essentials',
      name: 'Essentials',
      nameAr: 'الأساسيات',
      price: '149',
      currency: 'ريال',
      period: 'شهرياً',
      description: 'مثالي للشركات الناشئة',
      icon: Rocket,
      features: [
        '14 منشور كامل بالذكاء الاصطناعي (نص + تحسين الصورة)',
        'ارفع صورتك الخام، ThinkPost يحسنها لتبدو احترافية',
        'الذكاء الاصطناعي ينشئ تسميات توضيحية جذابة باللغة العربية',
        'جدولة ونشر تلقائي مضمن'
      ],
      buttonText: 'اشترك',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      id: 'growth',
      name: 'Growth',
      nameAr: 'النمو',
      price: '279',
      currency: 'ريال',
      period: 'شهرياً',
      description: 'مثالي للشركات المتنامية',
      icon: Sparkles,
      features: [
        'جميع ميزات خطة الأساسيات',
        '30 منشور مُنتج بالكامل شهرياً (نص + صور محسّنة)',
        'استخدم الوسائط الخاصة بك أو أعد استخدام التحميلات السابقة',
        'دعم ذو أولوية مضمن',
        'مثالي للنشر اليومي'
      ],
      buttonText: 'اشترك',
      buttonVariant: 'default' as const,
      popular: true
    }
  ];

  const handleSubscribe = (planId: string) => {
    navigate(`/payment?plan=${planId}`);
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 lg:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-deep-blue dark:text-white mb-4 sm:mb-6 leading-tight">
            خططنا وأسعارنا
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            اختر الخطة المناسبة لنشاطك التجاري واحصل على أفضل نتائج لمحتوى وسائل التواصل الاجتماعي
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in dark:bg-gray-800 ${
                plan.popular ? 'ring-2 ring-vibrant-purple' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >

              
              <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full ${
                  plan.popular ? 'bg-gradient-primary' : 'bg-gray-100 dark:bg-gray-700'
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${plan.popular ? 'text-white' : 'text-vibrant-purple'}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-deep-blue dark:text-white leading-tight">{plan.nameAr}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{plan.description}</p>
                <div className="flex items-baseline justify-center mt-3 sm:mt-4">
                  <span className="text-3xl sm:text-4xl font-bold text-deep-blue dark:text-white">{plan.price}</span>
                  <span className={`text-sm sm:text-base text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>{plan.currency}</span>
                  <span className={`text-sm sm:text-base text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>/ {plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <ul className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-start ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                      <Check className={`h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5 ${isRTL ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'}`} />
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.buttonVariant}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold h-10 sm:h-11 ${
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


      </div>
    </section>
  );
};

export default Pricing;
