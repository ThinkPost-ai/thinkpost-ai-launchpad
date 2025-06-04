
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

// Temporary function to load translations - will be moved to separate files
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
    }
  };
};
