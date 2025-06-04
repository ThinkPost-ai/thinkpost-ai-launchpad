
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('thinkpost-language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('thinkpost-language', language);
    
    // Update document direction and lang attribute
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove RTL class for additional styling
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language, isRTL]);

  // Simple translation function - will be enhanced with actual translations
  const t = (key: string): string => {
    const translations = getTranslations();
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    setLanguage,
    isRTL,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Comprehensive translations
const getTranslations = () => {
  return {
    en: {
      // Header
      'nav.features': 'Features',
      'nav.howItWorks': 'How It Works',
      'nav.pricing': 'Pricing',
      'nav.contact': 'Contact',
      'header.getStarted': 'Get Started',
      'header.signOut': 'Sign Out',
      'header.welcomeBack': 'Welcome back!',
      
      // Hero
      'hero.badge': 'AI-Powered Content Generation',
      'hero.title.transform': 'Transform Your',
      'hero.title.contentStrategy': 'Content Strategy',
      'hero.subtitle': 'Post smarter. Reach further. AI will do.',
      'hero.description': 'Create engaging, high-quality content in seconds with our advanced AI platform. Boost your productivity and never run out of ideas again.',
      'hero.startCreating': 'Start Creating Free',
      'hero.watchDemo': 'Watch Demo',
      'hero.goToDashboard': 'Go to Dashboard',
      'hero.loading': 'Loading...',
      'hero.stats.contentGenerated': 'Content Pieces Generated',
      'hero.stats.users': 'Happy Users',
      'hero.stats.uptime': 'Uptime',
      'hero.demoTitle': 'Demo Video Coming Soon',
      'hero.demoDescription': 'See our AI in action',
      
      // Features
      'features.title.powerful': 'Powerful Features for',
      'features.title.creators': 'Content Creators',
      'features.description': 'Everything you need to create, optimize, and scale your content strategy with the power of AI.',
      
      // How It Works
      'howItWorks.title': 'How It Works',
      'howItWorks.description': 'Get started with ThinkPost in just three simple steps and transform your content creation process.',
      'howItWorks.step1.title': 'Upload Your Products',
      'howItWorks.step1.description': 'Add your product photo and name with a simple upload.',
      'howItWorks.step2.title': 'AI Generates Content',
      'howItWorks.step2.description': 'Our advanced AI creates high-quality, engaging content for each product.',
      'howItWorks.step3.title': 'Review and Publish',
      'howItWorks.step3.description': 'Review the generated content, make any edits, then schedule and publish it across your channels.',
      'howItWorks.startTrial': 'Start Your Free Trial',

      // Testimonials
      'testimonials.title': 'What Our Customers Say',
      'testimonials.subtitle': 'Join hundreds of businesses that are already dominating social media with ThinkPost',
      'testimonials.testimonial1.role': 'Restaurant Owner',
      'testimonials.testimonial1.content': 'ThinkPost transformed our social media presence. Our engagement increased by 300% and we save 10 hours per week!',
      'testimonials.testimonial2.role': 'Marketing Director',
      'testimonials.testimonial2.content': 'The Arabic dialect support is incredible. It understands our local culture perfectly and creates authentic content.',
      'testimonials.testimonial3.role': 'Social Media Manager',
      'testimonials.testimonial3.content': 'From struggling with content creation to posting daily across all platforms. This tool is a game-changer!',
      'testimonials.at': 'at',
      'testimonials.stats.postsGenerated': 'Posts Generated',
      'testimonials.stats.happyBusinesses': 'Happy Businesses',
      'testimonials.stats.timeSaved': 'Time Saved',
      'testimonials.stats.customerRating': 'Customer Rating',

      // Pricing
      'pricing.title': 'Simple, Transparent Pricing',
      'pricing.subtitle': 'Choose the perfect plan for your business. All plans include our core AI features.',
      'pricing.mostPopular': 'Most Popular',
      'pricing.plans.free.name': 'Free',
      'pricing.plans.free.period': '/month',
      'pricing.plans.free.description': 'Perfect for getting started',
      'pricing.plans.free.features.posts': '5 posts per month',
      'pricing.plans.free.features.captions': 'Basic AI captions',
      'pricing.plans.free.features.platforms': '2 social platforms',
      'pricing.plans.free.features.support': 'Standard support',
      'pricing.plans.free.features.templates': 'Basic templates',
      'pricing.plans.free.buttonText': 'Start Free',
      'pricing.plans.pro.name': 'Pro',
      'pricing.plans.pro.period': '/month',
      'pricing.plans.pro.description': 'Best for growing businesses',
      'pricing.plans.pro.features.posts': '100 posts per month',
      'pricing.plans.pro.features.captions': 'Advanced AI captions',
      'pricing.plans.pro.features.platforms': 'All social platforms',
      'pricing.plans.pro.features.support': 'Priority support',
      'pricing.plans.pro.features.templates': 'Custom templates',
      'pricing.plans.pro.features.analytics': 'Analytics dashboard',
      'pricing.plans.pro.features.scheduling': 'Scheduling tools',
      'pricing.plans.pro.features.arabic': 'Arabic dialect support',
      'pricing.plans.pro.buttonText': 'Start Pro',
      'pricing.plans.business.name': 'Business',
      'pricing.plans.business.period': '/month',
      'pricing.plans.business.description': 'For large teams and agencies',
      'pricing.plans.business.features.posts': 'Unlimited posts',
      'pricing.plans.business.features.captions': 'Premium AI captions',
      'pricing.plans.business.features.platforms': 'All social platforms',
      'pricing.plans.business.features.support': '24/7 dedicated support',
      'pricing.plans.business.features.branding': 'Custom branding',
      'pricing.plans.business.features.analytics': 'Advanced analytics',
      'pricing.plans.business.features.collaboration': 'Team collaboration',
      'pricing.plans.business.features.api': 'API access',
      'pricing.plans.business.features.whiteLabel': 'White-label solution',
      'pricing.plans.business.features.integrations': 'Custom integrations',
      'pricing.plans.business.buttonText': 'Start Business',
      'pricing.enterprise.title': 'Need Something Custom?',
      'pricing.enterprise.description': 'For enterprise clients with special requirements, we offer custom solutions and dedicated support.',
      'pricing.enterprise.buttonText': 'Contact Sales',

      // FAQ
      'faq.title': 'Frequently Asked Questions',
      'faq.subtitle': 'Everything you need to know about ThinkPost',
      'faq.questions.q1.question': 'How does ThinkPost generate captions?',
      'faq.questions.q1.answer': 'Our advanced AI analyzes your content, understands the context, and generates engaging captions tailored to each social media platform. It considers factors like audience, tone, trending hashtags, and platform-specific best practices.',
      'faq.questions.q2.question': 'Which social media platforms are supported?',
      'faq.questions.q2.answer': 'We support all major platforms including Instagram, TikTok, Facebook, X (Twitter), LinkedIn, YouTube, and Pinterest. Each platform gets optimized content that fits its unique requirements and audience expectations.',
      'faq.questions.q3.question': 'Can I customize the generated captions?',
      'faq.questions.q3.answer': 'Absolutely! Our AI provides a great starting point, but you have full control to edit, modify, or completely rewrite any generated content. You can also set preferences for tone, style, and specific keywords.',
      'faq.questions.q4.question': 'How accurate is the Arabic dialect support?',
      'faq.questions.q4.answer': 'Our AI is specifically trained on Saudi Arabic dialects and cultural nuances. It understands local expressions, cultural references, and creates authentic content that resonates with Arabic-speaking audiences.',
      'faq.questions.q5.question': 'Is there a free trial available?',
      'faq.questions.q5.answer': 'Yes! Our Free plan includes 5 posts per month with basic AI captions for 2 social platforms. You can upgrade anytime to access more features and higher limits.',
      'faq.questions.q6.question': 'Can I schedule posts for later?',
      'faq.questions.q6.answer': 'Yes, with our Pro and Business plans, you get access to our scheduling tools. You can plan your content calendar and automatically publish posts at optimal times for maximum engagement.',
      'faq.questions.q7.question': 'What file formats do you support?',
      'faq.questions.q7.answer': 'We support all major image formats (JPG, PNG, GIF, WebP) and video formats (MP4, MOV, AVI). Our system automatically optimizes your content for each platform\'s requirements.',
      'faq.questions.q8.question': 'How secure is my content?',
      'faq.questions.q8.answer': 'We take security seriously. All uploads are encrypted, and we never store your content longer than necessary. Your data is protected with enterprise-grade security measures and we never share it with third parties.',
      'faq.contact.title': 'Still Have Questions?',
      'faq.contact.description': 'Our support team is here to help you get the most out of ThinkPost',
      'faq.contact.buttonText': 'Contact Support',

      // Footer
      'footer.newsletter.title': 'Stay Updated with ThinkPost',
      'footer.newsletter.description': 'Get the latest updates, tips, and exclusive content creation strategies delivered to your inbox.',
      'footer.newsletter.placeholder': 'Enter your email',
      'footer.newsletter.buttonText': 'Subscribe',
      'footer.description': 'Revolutionizing content creation with AI-powered tools that help you create engaging, high-quality content in seconds.',
      'footer.sections.product': 'Product',
      'footer.sections.company': 'Company',
      'footer.sections.support': 'Support',
      'footer.sections.legal': 'Legal',
      'footer.product.features': 'Features',
      'footer.product.pricing': 'Pricing',
      'footer.product.api': 'API',
      'footer.product.documentation': 'Documentation',
      'footer.company.about': 'About Us',
      'footer.company.careers': 'Careers',
      'footer.company.press': 'Press',
      'footer.company.contact': 'Contact',
      'footer.support.helpCenter': 'Help Center',
      'footer.support.community': 'Community',
      'footer.support.status': 'Status',
      'footer.support.security': 'Security',
      'footer.legal.privacy': 'Privacy Policy',
      'footer.legal.terms': 'Terms of Service',
      'footer.legal.cookies': 'Cookie Policy',
      'footer.legal.gdpr': 'GDPR',
      'footer.copyright': '© 2024 ThinkPost. All rights reserved.',
      'footer.bottomLinks.privacy': 'Privacy',
      'footer.bottomLinks.terms': 'Terms',
      'footer.bottomLinks.cookies': 'Cookies',
    },
    ar: {
      // Header
      'nav.features': 'المميزات',
      'nav.howItWorks': 'كيف يعمل',
      'nav.pricing': 'الأسعار',
      'nav.contact': 'اتصل بنا',
      'header.getStarted': 'ابدأ الآن',
      'header.signOut': 'تسجيل الخروج',
      'header.welcomeBack': 'أهلاً بعودتك!',
      
      // Hero
      'hero.badge': 'إنتاج محتوى بالذكاء الاصطناعي',
      'hero.title.transform': 'حوّل',
      'hero.title.contentStrategy': 'استراتيجية المحتوى',
      'hero.subtitle': 'انشر بذكاء. وصل أبعد. الذكاء الاصطناعي سيقوم بالباقي.',
      'hero.description': 'أنشئ محتوى جذاب وعالي الجودة في ثوانٍ مع منصة الذكاء الاصطناعي المتقدمة. عزز إنتاجيتك ولن تنفد أفكارك أبداً.',
      'hero.startCreating': 'ابدأ الإنشاء مجاناً',
      'hero.watchDemo': 'شاهد العرض التوضيحي',
      'hero.goToDashboard': 'اذهب إلى لوحة التحكم',
      'hero.loading': 'جارٍ التحميل...',
      'hero.stats.contentGenerated': 'قطعة محتوى منتجة',
      'hero.stats.users': 'مستخدم سعيد',
      'hero.stats.uptime': 'وقت التشغيل',
      'hero.demoTitle': 'فيديو العرض التوضيحي قريباً',
      'hero.demoDescription': 'شاهد الذكاء الاصطناعي في العمل',
      
      // Features
      'features.title.powerful': 'مميزات قوية لـ',
      'features.title.creators': 'منشئي المحتوى',
      'features.description': 'كل ما تحتاجه لإنشاء وتحسين وتوسيع استراتيجية المحتوى الخاصة بك بقوة الذكاء الاصطناعي.',
      
      // How It Works
      'howItWorks.title': 'كيف يعمل',
      'howItWorks.description': 'ابدأ مع ThinkPost في ثلاث خطوات بسيطة وحوّل عملية إنشاء المحتوى الخاصة بك.',
      'howItWorks.step1.title': 'ارفع منتجاتك',
      'howItWorks.step1.description': 'أضف صورة المنتج والاسم برفع بسيط.',
      'howItWorks.step2.title': 'الذكاء الاصطناعي ينتج المحتوى',
      'howItWorks.step2.description': 'ذكاؤنا الاصطناعي المتقدم ينشئ محتوى عالي الجودة وجذاب لكل منتج.',
      'howItWorks.step3.title': 'راجع وانشر',
      'howItWorks.step3.description': 'راجع المحتوى المُنتج، قم بأي تعديلات، ثم جدول وانشر عبر قنواتك.',
      'howItWorks.startTrial': 'ابدأ تجربتك المجانية',

      // Testimonials
      'testimonials.title': 'ماذا يقول عملاؤنا',
      'testimonials.subtitle': 'انضم إلى مئات الشركات التي تهيمن بالفعل على وسائل التواصل الاجتماعي مع ThinkPost',
      'testimonials.testimonial1.role': 'صاحبة مطعم',
      'testimonials.testimonial1.content': 'ThinkPost حوّل حضورنا على وسائل التواصل الاجتماعي. زاد تفاعلنا بنسبة 300% ونوفر 10 ساعات أسبوعياً!',
      'testimonials.testimonial2.role': 'مدير التسويق',
      'testimonials.testimonial2.content': 'دعم اللهجة العربية رائع. يفهم ثقافتنا المحلية بشكل مثالي وينشئ محتوى أصيل.',
      'testimonials.testimonial3.role': 'مديرة وسائل التواصل الاجتماعي',
      'testimonials.testimonial3.content': 'من الكفاح مع إنشاء المحتوى إلى النشر اليومي عبر جميع المنصات. هذه الأداة تغير قواعد اللعبة!',
      'testimonials.at': 'في',
      'testimonials.stats.postsGenerated': 'منشور منتج',
      'testimonials.stats.happyBusinesses': 'شركة سعيدة',
      'testimonials.stats.timeSaved': 'وقت موفر',
      'testimonials.stats.customerRating': 'تقييم العملاء',

      // Pricing
      'pricing.title': 'أسعار بسيطة وشفافة',
      'pricing.subtitle': 'اختر الخطة المثالية لعملك. جميع الخطط تشمل ميزات الذكاء الاصطناعي الأساسية.',
      'pricing.mostPopular': 'الأكثر شعبية',
      'pricing.plans.free.name': 'مجاني',
      'pricing.plans.free.period': '/شهر',
      'pricing.plans.free.description': 'مثالي للبداية',
      'pricing.plans.free.features.posts': '5 منشورات شهرياً',
      'pricing.plans.free.features.captions': 'تسميات توضيحية أساسية بالذكاء الاصطناعي',
      'pricing.plans.free.features.platforms': 'منصتان اجتماعيتان',
      'pricing.plans.free.features.support': 'دعم قياسي',
      'pricing.plans.free.features.templates': 'قوالب أساسية',
      'pricing.plans.free.buttonText': 'ابدأ مجاناً',
      'pricing.plans.pro.name': 'احترافي',
      'pricing.plans.pro.period': '/شهر',
      'pricing.plans.pro.description': 'الأفضل للشركات النامية',
      'pricing.plans.pro.features.posts': '100 منشور شهرياً',
      'pricing.plans.pro.features.captions': 'تسميات توضيحية متقدمة بالذكاء الاصطناعي',
      'pricing.plans.pro.features.platforms': 'جميع المنصات الاجتماعية',
      'pricing.plans.pro.features.support': 'دعم ذو أولوية',
      'pricing.plans.pro.features.templates': 'قوالب مخصصة',
      'pricing.plans.pro.features.analytics': 'لوحة تحليلات',
      'pricing.plans.pro.features.scheduling': 'أدوات الجدولة',
      'pricing.plans.pro.features.arabic': 'دعم اللهجة العربية',
      'pricing.plans.pro.buttonText': 'ابدأ الاحترافي',
      'pricing.plans.business.name': 'تجاري',
      'pricing.plans.business.period': '/شهر',
      'pricing.plans.business.description': 'للفرق الكبيرة والوكالات',
      'pricing.plans.business.features.posts': 'منشورات غير محدودة',
      'pricing.plans.business.features.captions': 'تسميات توضيحية مميزة بالذكاء الاصطناعي',
      'pricing.plans.business.features.platforms': 'جميع المنصات الاجتماعية',
      'pricing.plans.business.features.support': 'دعم مخصص على مدار الساعة',
      'pricing.plans.business.features.branding': 'علامة تجارية مخصصة',
      'pricing.plans.business.features.analytics': 'تحليلات متقدمة',
      'pricing.plans.business.features.collaboration': 'تعاون الفريق',
      'pricing.plans.business.features.api': 'وصول API',
      'pricing.plans.business.features.whiteLabel': 'حل العلامة البيضاء',
      'pricing.plans.business.features.integrations': 'تكاملات مخصصة',
      'pricing.plans.business.buttonText': 'ابدأ التجاري',
      'pricing.enterprise.title': 'تحتاج شيئاً مخصصاً؟',
      'pricing.enterprise.description': 'لعملاء المؤسسات ذوي المتطلبات الخاصة، نقدم حلولاً مخصصة ودعماً مخصصاً.',
      'pricing.enterprise.buttonText': 'اتصل بالمبيعات',

      // FAQ
      'faq.title': 'الأسئلة الشائعة',
      'faq.subtitle': 'كل ما تحتاج لمعرفته عن ThinkPost',
      'faq.questions.q1.question': 'كيف ينتج ThinkPost التسميات التوضيحية؟',
      'faq.questions.q1.answer': 'ذكاؤنا الاصطناعي المتقدم يحلل محتواك، يفهم السياق، وينتج تسميات توضيحية جذابة مخصصة لكل منصة تواصل اجتماعي. يأخذ في الاعتبار عوامل مثل الجمهور والنبرة والهاشتاجات الرائجة وأفضل ممارسات كل منصة.',
      'faq.questions.q2.question': 'ما هي منصات التواصل الاجتماعي المدعومة؟',
      'faq.questions.q2.answer': 'ندعم جميع المنصات الرئيسية بما في ذلك Instagram و TikTok و Facebook و X (Twitter) و LinkedIn و YouTube و Pinterest. كل منصة تحصل على محتوى محسّن يناسب متطلباتها الفريدة وتوقعات جمهورها.',
      'faq.questions.q3.question': 'هل يمكنني تخصيص التسميات التوضيحية المنتجة؟',
      'faq.questions.q3.answer': 'بالطبع! ذكاؤنا الاصطناعي يوفر نقطة بداية رائعة، لكن لديك السيطرة الكاملة لتحرير أو تعديل أو إعادة كتابة أي محتوى منتج بالكامل. يمكنك أيضاً تعيين تفضيلات للنبرة والأسلوب وكلمات مفتاحية محددة.',
      'faq.questions.q4.question': 'ما مدى دقة دعم اللهجة العربية؟',
      'faq.questions.q4.answer': 'ذكاؤنا الاصطناعي مدرب خصيصاً على اللهجات العربية السعودية والفروق الثقافية. يفهم التعبيرات المحلية والمراجع الثقافية وينشئ محتوى أصيل يتردد صداه مع الجماهير الناطقة بالعربية.',
      'faq.questions.q5.question': 'هل هناك تجربة مجانية متاحة؟',
      'faq.questions.q5.answer': 'نعم! خطتنا المجانية تشمل 5 منشورات شهرياً مع تسميات توضيحية أساسية بالذكاء الاصطناعي لمنصتين اجتماعيتين. يمكنك الترقية في أي وقت للوصول إلى المزيد من الميزات والحدود الأعلى.',
      'faq.questions.q6.question': 'هل يمكنني جدولة المنشورات لوقت لاحق؟',
      'faq.questions.q6.answer': 'نعم، مع خططنا الاحترافية والتجارية، تحصل على الوصول إلى أدوات الجدولة لدينا. يمكنك التخطيط لتقويم المحتوى الخاص بك ونشر المنشورات تلقائياً في الأوقات المثلى لأقصى تفاعل.',
      'faq.questions.q7.question': 'ما هي تنسيقات الملفات التي تدعمونها؟',
      'faq.questions.q7.answer': 'ندعم جميع تنسيقات الصور الرئيسية (JPG، PNG، GIF، WebP) وتنسيقات الفيديو (MP4، MOV، AVI). نظامنا يحسن محتواك تلقائياً لمتطلبات كل منصة.',
      'faq.questions.q8.question': 'ما مدى أمان محتواي؟',
      'faq.questions.q8.answer': 'نأخذ الأمان على محمل الجد. جميع التحميلات مشفرة، ولا نخزن محتواك أطول من اللازم. بياناتك محمية بتدابير أمنية على مستوى المؤسسات ولا نشاركها مع أطراف ثالثة أبداً.',
      'faq.contact.title': 'لا تزال لديك أسئلة؟',
      'faq.contact.description': 'فريق الدعم لدينا هنا لمساعدتك في الحصول على أقصى استفادة من ThinkPost',
      'faq.contact.buttonText': 'اتصل بالدعم',

      // Footer
      'footer.newsletter.title': 'ابق محدثاً مع ThinkPost',
      'footer.newsletter.description': 'احصل على آخر التحديثات والنصائح واستراتيجيات إنشاء المحتوى الحصرية في صندوق الوارد الخاص بك.',
      'footer.newsletter.placeholder': 'أدخل بريدك الإلكتروني',
      'footer.newsletter.buttonText': 'اشترك',
      'footer.description': 'نحدث ثورة في إنشاء المحتوى بأدوات مدعومة بالذكاء الاصطناعي تساعدك على إنشاء محتوى جذاب وعالي الجودة في ثوانٍ.',
      'footer.sections.product': 'المنتج',
      'footer.sections.company': 'الشركة',
      'footer.sections.support': 'الدعم',
      'footer.sections.legal': 'قانوني',
      'footer.product.features': 'المميزات',
      'footer.product.pricing': 'الأسعار',
      'footer.product.api': 'واجهة برمجة التطبيقات',
      'footer.product.documentation': 'التوثيق',
      'footer.company.about': 'من نحن',
      'footer.company.careers': 'الوظائف',
      'footer.company.press': 'الصحافة',
      'footer.company.contact': 'اتصل بنا',
      'footer.support.helpCenter': 'مركز المساعدة',
      'footer.support.community': 'المجتمع',
      'footer.support.status': 'الحالة',
      'footer.support.security': 'الأمان',
      'footer.legal.privacy': 'سياسة الخصوصية',
      'footer.legal.terms': 'شروط الخدمة',
      'footer.legal.cookies': 'سياسة ملفات تعريف الارتباط',
      'footer.legal.gdpr': 'اللائحة العامة لحماية البيانات',
      'footer.copyright': '© 2024 ThinkPost. جميع الحقوق محفوظة.',
      'footer.bottomLinks.privacy': 'الخصوصية',
      'footer.bottomLinks.terms': 'الشروط',
      'footer.bottomLinks.cookies': 'ملفات تعريف الارتباط',
    }
  };
};
