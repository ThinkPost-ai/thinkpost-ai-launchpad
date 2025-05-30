import { ArrowRight, Upload, Wand2, Rocket } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your Content',
      description: 'Drag and drop your photos and videos into our platform. We handle the rest.',
      step: '01'
    },
    {
      icon: Wand2,
      title: 'AI Generates Captions',
      description: 'Our smart AI creates engaging captions, hashtags, and content optimized for each platform.',
      step: '02'
    },
    {
      icon: Rocket,
      title: 'Post & Engage',
      description: 'Publish across all your social media platforms instantly or schedule for later.',
      step: '03'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Get from content idea to published post in just three simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connection lines for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-vibrant-purple to-deep-blue transform -translate-y-1/2 z-0"></div>
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary text-white rounded-full text-xl font-bold mb-6 relative">
                  {step.step}
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 text-vibrant-purple" />
                  )}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl transition-shadow duration-300">
                  <step.icon className="h-10 w-10 text-vibrant-purple" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-deep-blue mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo section */}
        <div className="mt-20 text-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-deep-blue mb-6">
              See It In Action
            </h3>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-64 flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600">Interactive Demo Coming Soon</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Watch how ThinkPost.ai transforms your content into engaging social media posts in seconds.
            </p>
            <button className="bg-gradient-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold">
              Request Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
