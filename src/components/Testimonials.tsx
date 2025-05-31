
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Al-Rashid',
      role: 'Restaurant Owner',
      company: 'Al-Baik Delights',
      content: 'ThinkPost transformed our social media presence. Our engagement increased by 300% and we save 10 hours per week!',
      avatar: '👩‍🍳',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      role: 'Marketing Director',
      company: 'Local Coffee House',
      content: 'The Arabic dialect support is incredible. It understands our local culture perfectly and creates authentic content.',
      avatar: '☕',
      rating: 5
    },
    {
      name: 'Fatima Al-Zahra',
      role: 'Social Media Manager',
      company: 'Fashion Boutique',
      content: 'From struggling with content creation to posting daily across all platforms. This tool is a game-changer!',
      avatar: '👗',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-6">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Join hundreds of businesses that are already dominating social media with ThinkPost
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-600 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-deep-blue">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
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
              <div className="text-white/80">Posts Generated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80">Happy Businesses</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">95%</div>
              <div className="text-white/80">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-white/80">Customer Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
