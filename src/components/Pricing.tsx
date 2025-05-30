
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      icon: Rocket,
      features: [
        '5 posts per month',
        'Basic AI captions',
        '2 social platforms',
        'Standard support',
        'Basic templates'
      ],
      buttonText: 'Start Free',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'Best for growing businesses',
      icon: Sparkles,
      features: [
        '100 posts per month',
        'Advanced AI captions',
        'All social platforms',
        'Priority support',
        'Custom templates',
        'Analytics dashboard',
        'Scheduling tools',
        'Arabic dialect support'
      ],
      buttonText: 'Start Pro',
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      name: 'Business',
      price: '$99',
      period: '/month',
      description: 'For large teams and agencies',
      icon: Crown,
      features: [
        'Unlimited posts',
        'Premium AI captions',
        'All social platforms',
        '24/7 dedicated support',
        'Custom branding',
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'White-label solution',
        'Custom integrations'
      ],
      buttonText: 'Start Business',
      buttonVariant: 'outline' as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Choose the perfect plan for your business. All plans include our core AI features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in ${
                plan.popular ? 'ring-2 ring-vibrant-purple' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
                  plan.popular ? 'bg-gradient-primary' : 'bg-gray-100'
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className={`h-8 w-8 ${plan.popular ? 'text-white' : 'text-vibrant-purple'}`} />
                </div>
                <h3 className="text-2xl font-bold text-deep-blue">{plan.name}</h3>
                <p className="text-gray-600">{plan.description}</p>
                <div className="flex items-baseline justify-center mt-4">
                  <span className="text-4xl font-bold text-deep-blue">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.buttonVariant}
                  className={`w-full py-3 font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90 text-white' 
                      : plan.buttonVariant === 'outline'
                      ? 'border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white'
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
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-deep-blue mb-4">
              Need Something Custom?
            </h3>
            <p className="text-gray-600 mb-6">
              For enterprise clients with special requirements, we offer custom solutions and dedicated support.
            </p>
            <Button variant="outline" className="border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
