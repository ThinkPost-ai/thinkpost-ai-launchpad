
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Testimonials = () => {
  const { t, isRTL } = useLanguage();

  const testimonials = [
    {
      name: 'Sarah Al-Rashid',
      role: t('testimonials.testimonial1.role'),
      company: 'Al-Baik Delights',
      content: t('testimonials.testimonial1.content'),
      avatar: '👩‍🍳',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      role: t('testimonials.testimonial2.role'),
      company: 'Local Coffee House',
      content: t('testimonials.testimonial2.content'),
      avatar: '☕',
      rating: 5
    },
    {
      name: 'Fatima Al-Zahra',
      role: t('testimonials.testimonial3.role'),
      company: 'Fashion Boutique',
      content: t('testimonials.testimonial3.content'),
      avatar: '👗',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue dark:text-white mb-6">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in dark:bg-gray-800"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className={`text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic ${isRTL ? 'text-right' : 'text-left'}`}>
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-4' : 'space-x-4'}`}>
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl">
                    {testimonial.avatar}
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="font-semibold text-deep-blue dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} {t('testimonials.at')} {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social proof numbers */}
        <div className="mt-16 bg-gradient-primary rounded-2xl p-8 md:p-12 text-white animate-fade-in">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
              <div className="text-white/80">{t('testimonials.stats.postsGenerated')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80">{t('testimonials.stats.happyBusinesses')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">95%</div>
              <div className="text-white/80">{t('testimonials.stats.timeSaved')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-white/80">{t('testimonials.stats.customerRating')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
