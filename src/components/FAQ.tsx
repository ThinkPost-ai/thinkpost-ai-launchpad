
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: 'How does ThinkPost generate captions?',
      answer: 'Our advanced AI analyzes your content, understands the context, and generates engaging captions tailored to each social media platform. It considers factors like audience, tone, trending hashtags, and platform-specific best practices.'
    },
    {
      question: 'Which social media platforms are supported?',
      answer: 'We support all major platforms including Instagram, TikTok, Facebook, X (Twitter), LinkedIn, YouTube, and Pinterest. Each platform gets optimized content that fits its unique requirements and audience expectations.'
    },
    {
      question: 'Can I customize the generated captions?',
      answer: 'Absolutely! Our AI provides a great starting point, but you have full control to edit, modify, or completely rewrite any generated content. You can also set preferences for tone, style, and specific keywords.'
    },
    {
      question: 'How accurate is the Arabic dialect support?',
      answer: 'Our AI is specifically trained on Saudi Arabic dialects and cultural nuances. It understands local expressions, cultural references, and creates authentic content that resonates with Arabic-speaking audiences.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes! Our Free plan includes 5 posts per month with basic AI captions for 2 social platforms. You can upgrade anytime to access more features and higher limits.'
    },
    {
      question: 'Can I schedule posts for later?',
      answer: 'Yes, with our Pro and Business plans, you get access to our scheduling tools. You can plan your content calendar and automatically publish posts at optimal times for maximum engagement.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support all major image formats (JPG, PNG, GIF, WebP) and video formats (MP4, MOV, AVI). Our system automatically optimizes your content for each platform\'s requirements.'
    },
    {
      question: 'How secure is my content?',
      answer: 'We take security seriously. All uploads are encrypted, and we never store your content longer than necessary. Your data is protected with enterprise-grade security measures and we never share it with third parties.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about ThinkPost
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleItem(index)}
                >
                  <h3 className="text-lg font-semibold text-deep-blue pr-4">
                    {faq.question}
                  </h3>
                  {openItems.includes(index) ? (
                    <ChevronUp className="h-5 w-5 text-vibrant-purple flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-vibrant-purple flex-shrink-0" />
                  )}
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-16 text-center animate-fade-in">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-white max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Still Have Questions?
            </h3>
            <p className="text-white/80 mb-6">
              Our support team is here to help you get the most out of ThinkPost
            </p>
            <button className="bg-white text-deep-blue px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
