
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ = () => {
  const { t, isRTL } = useLanguage();
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
      question: t('faq.questions.q1.question'),
      answer: t('faq.questions.q1.answer')
    },
    {
      question: t('faq.questions.q2.question'),
      answer: t('faq.questions.q2.answer')
    },
    {
      question: t('faq.questions.q3.question'),
      answer: t('faq.questions.q3.answer')
    },
    {
      question: t('faq.questions.q4.question'),
      answer: t('faq.questions.q4.answer')
    },
    {
      question: t('faq.questions.q5.question'),
      answer: t('faq.questions.q5.answer')
    },
    {
      question: t('faq.questions.q6.question'),
      answer: t('faq.questions.q6.answer')
    },
    {
      question: t('faq.questions.q7.question'),
      answer: t('faq.questions.q7.answer')
    },
    {
      question: t('faq.questions.q8.question'),
      answer: t('faq.questions.q8.answer')
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue dark:text-white mb-6">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in dark:bg-gray-800"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-0">
                <button
                  className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  onClick={() => toggleItem(index)}
                >
                  <h3 className={`text-lg font-semibold text-deep-blue dark:text-white ${isRTL ? 'pl-4' : 'pr-4'}`}>
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
                    <p className={`text-gray-600 dark:text-gray-300 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
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
              {t('faq.contact.title')}
            </h3>
            <p className="text-white/80 mb-6">
              {t('faq.contact.description')}
            </p>
            <button className="bg-white text-deep-blue px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              {t('faq.contact.buttonText')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
