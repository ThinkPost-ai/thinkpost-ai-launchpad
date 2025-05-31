
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Sparkles, Download, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: PenTool,
      step: "01",
      title: "Describe Your Needs",
      description: "Tell us what type of content you need, your target audience, and key messaging points."
    },
    {
      icon: Sparkles,
      step: "02", 
      title: "AI Creates Content",
      description: "Our advanced AI analyzes your requirements and generates high-quality, engaging content."
    },
    {
      icon: Download,
      step: "03",
      title: "Review & Use",
      description: "Review the generated content, make any adjustments, and publish across your channels."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-deep-blue dark:text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get started with ThinkPost in just three simple steps and transform your content creation process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center p-8 h-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-vibrant-purple dark:text-purple-400 mb-2">STEP {step.step}</div>
                  <h3 className="text-xl font-semibold text-deep-blue dark:text-white mb-4">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 text-lg font-semibold">
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
