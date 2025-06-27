import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, any>) => string;
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

  // Enhanced translation function with parameter support
  const t = (key: string, params?: Record<string, any>): string => {
    const translations = getTranslations();
    let translation = translations[language]?.[key] || key;
    
    // Replace parameters in translation if provided
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
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
      'hero.demoTitle': 'Demo Video Coming Soon',
      'hero.demoDescription': 'See our AI in action',
      
      // Features
      'features.title.powerful': 'Powerful Features for',
      'features.title.creators': 'Content Creators',
      'features.description': 'Everything you need to create, optimize, and scale your content strategy with the power of AI.',
      'features.feature1.title': 'AI-Powered Generation',
      'features.feature1.description': 'Advanced algorithms create human-like content tailored to your brand voice and style.',
      'features.feature2.title': 'Lightning Fast',
      'features.feature2.description': 'Generate high-quality content in seconds, not hours. Boost your productivity instantly.',
      'features.feature3.title': 'Targeted Content',
      'features.feature3.description': 'Create content optimized for your specific audience and marketing goals.',
      'features.feature4.title': 'Quality Assurance',
      'features.feature4.description': 'Built-in quality checks ensure your content meets the highest standards.',
      'features.feature5.title': 'Multi-Language',
      'features.feature5.description': 'Generate content in over 50 languages to reach a global audience.',
      'features.feature6.title': 'SEO Optimized',
      'features.feature6.description': 'Content automatically optimized for search engines to boost your rankings.',
      
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
      'faq.questions.q2.answer': 'Currently, we support TikTok — and we\'re actively working to expand support to Instagram, Snapchat, and X (Twitter). Our goal is to deliver optimized, platform-specific content across all major social channels.',
      'faq.questions.q3.question': 'Can I customize the generated captions?',
      'faq.questions.q3.answer': 'Absolutely! Our AI provides a great starting point, but you have full control to edit, modify, or completely rewrite any generated content. You can also set preferences for tone, style, and specific keywords.',
      'faq.questions.q4.question': 'How accurate is the Arabic dialect support?',
      'faq.questions.q4.answer': 'Our AI is designed to create content that fits Saudi culture — capturing local expressions, tone, and relevance to engage Arabic-speaking audiences effectively.',
      'faq.questions.q5.question': 'Is there a free trial available?',
      'faq.questions.q5.answer': 'Yes! Our Free plan gives you 14 AI-generated TikTok posts each month. You can upgrade anytime to unlock more features and scale your content strategy.',
      'faq.questions.q6.question': 'Can I schedule posts for later?',
      'faq.questions.q6.answer': 'Yes, with our Pro and Business plans, you get access to our scheduling tools. You can plan your content calendar and automatically publish posts at optimal times for maximum engagement.',
      'faq.questions.q7.question': 'What file formats do you support?',
      'faq.questions.q7.answer': 'We currently support major image formats like JPG, PNG, GIF, and WebP. Video uploads are not yet supported — but they\'re coming soon!',
      'faq.questions.q8.question': 'How secure is my content?',
      'faq.questions.q8.answer': 'We take security seriously. All uploads are encrypted, and we never store your content longer than necessary.',
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
      
      // Dashboard
      'dashboard.loading': 'Loading your dashboard...',
      'dashboard.tabs.overview': 'Overview',
      'dashboard.tabs.media': 'Media',
      'dashboard.tabs.captions': 'Captions',
      'dashboard.tabs.schedule': 'Schedule',
      'dashboard.tabs.notifications': 'Notifications',
      
      // Overview Cards
      'dashboard.overview.totalPosts': 'Total Posts',
      'dashboard.overview.totalPostsSubtext': '+12% from last month',
      'dashboard.overview.upcomingPosts': 'Upcoming Posts',
      'dashboard.overview.upcomingPostsSubtext': 'Scheduled this week',
      'dashboard.overview.captionCredits': 'Caption Credits',
      'dashboard.overview.captionCreditsSubtext': '{credits} credits remaining',
      'dashboard.overview.mediaLibrary': 'Media Library',
      'dashboard.overview.mediaLibrarySubtext': 'Images uploaded',
      
      // Quick Actions
      'dashboard.quickActions.title': 'Quick Actions',
      'dashboard.quickActions.addProducts': 'Start & add products',
      'dashboard.quickActions.viewCaptions': 'View Captions',
      'dashboard.quickActions.schedulePost': 'Schedule Post',
      
      // TikTok Connection
      'dashboard.tiktok.title': 'TikTok Connection',
      'dashboard.tiktok.description': 'Connect your TikTok account to schedule and post content directly',
      'dashboard.tiktok.connectedAs': 'Connected as @{username}',
      'dashboard.tiktok.connectedStatus': 'Connected to TikTok',
      'dashboard.tiktok.disconnect': 'Disconnect TikTok',
      'dashboard.tiktok.connectDescription': 'Connect your TikTok account to access additional features and enhance your content creation.',
      'dashboard.tiktok.connecting': 'Connecting...',
      'dashboard.tiktok.connect': 'Connect TikTok',
      
      // User Profile
      'dashboard.profile.owner': 'Owner',
      'dashboard.profile.profileSettings': 'Profile Settings',
      'dashboard.profile.accountSettings': 'Account Settings',
      'dashboard.profile.signOut': 'Sign Out',
      
      // Media Management
      'media.title': 'Media Management',
      'media.description': 'Manage your uploaded photos and product images',
      'media.addProducts': 'Add Products',
      'media.selectAll': 'Select All Products',
      'media.cancelSelection': 'Cancel Selection',
      'media.deleteSelected': 'Delete Selected ({count})',
      'media.deleteAll': 'Delete All Products',
      'media.noMedia': 'No media uploaded yet',
      'media.noFilter': 'No {filter} found',
      'media.viewGrid': 'Grid View',
      'media.viewList': 'List View',
      'media.filterAll': 'All',
      'media.filterImages': 'Images',
      'media.filterProducts': 'Products',
      'media.filterWithCaptions': 'With Captions',
      'media.filterWithoutCaptions': 'Without Captions',

      // Generated Captions
      'captions.title': 'Generated Captions',
      'captions.description': 'Manage your AI-generated captions for images and products',
      'captions.regenerate': 'Regenerate caption',
      'captions.noCredits': 'No caption credits remaining',
      'captions.generating': 'Generating...',
      'captions.generated': 'Caption generated successfully',
      'captions.failed': 'Failed to generate caption',
      'captions.noContent': 'No content yet',
      'captions.addProducts': 'Add some products with images to generate AI captions',
      'captions.addFirst': 'Add Your First Product',
      'captions.addMore': 'Add More Content',

      // Table Headers
      'table.content': 'Content',
      'table.caption': 'Caption',
      'table.details': 'Details',
      'table.status': 'Status',
      'table.performance': 'Performance',
      'table.actions': 'Actions',

      // Authentication
      'auth.welcomeBack': 'Welcome Back',
      'auth.signInToAccount': 'Sign in to your ThinkPost account',
      'auth.emailConfirmationRequired': 'Email confirmation required:',
      'auth.checkEmailConfirmation': 'Please check your email inbox and click the confirmation link. If you don\'t see the email, check your spam folder.',
      'auth.invalidCredentials': 'Invalid email or password. Please check your credentials and try again.',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.enterEmail': 'Enter your email',
      'auth.enterPassword': 'Enter your password',
      'auth.forgotPassword': 'Forgot password?',
      'auth.signIn': 'Sign In',
      'auth.signingIn': 'Signing In...',
      'auth.signUp': 'Sign Up',
      'auth.dontHaveAccount': 'Don\'t have an account?',
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.joinThinkPost': 'Join ThinkPost',
      'auth.createAccountToStart': 'Create your account to get started',
      'auth.fullName': 'Full Name',
      'auth.enterFullName': 'Enter your full name',
      'auth.createStrongPassword': 'Create a strong password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.confirmYourPassword': 'Confirm your password',
      'auth.agreeToTerms': 'By signing up, you agree to our',
      'auth.termsOfService': 'Terms of Service',
      'auth.and': 'and',
      'auth.privacyPolicy': 'Privacy Policy',
      'auth.createAccount': 'Create Account',
      'auth.creatingAccount': 'Creating Account...',

      // Account Settings
      'accountSettings.title': 'Account Settings',
      'accountSettings.description': 'Manage your account preferences and security settings',
      'accountSettings.back': 'Back',
      'accountSettings.currentAccount': 'Current Account',
      'accountSettings.emailAddress': 'Email Address',
      'accountSettings.changeEmail': 'Change Email Address',
      'accountSettings.changeEmailDescription': 'Update your email address. You\'ll need to confirm both your old and new email addresses.',
      'accountSettings.newEmailAddress': 'New Email Address',
      'accountSettings.enterNewEmail': 'Enter your new email address',
      'accountSettings.updateEmail': 'Update Email',
      'accountSettings.updating': 'Updating...',
      'accountSettings.emailUpdateRequested': 'Email Update Requested',
      'accountSettings.emailUpdateDescription': 'Please check both your old and new email addresses for confirmation links.',
      'accountSettings.changePassword': 'Change Password',
      'accountSettings.changePasswordDescription': 'Update your password to keep your account secure.',
      'accountSettings.newPassword': 'New Password',
      'accountSettings.enterNewPassword': 'Enter your new password',
      'accountSettings.confirmNewPassword': 'Confirm New Password',
      'accountSettings.confirmNewPasswordPlaceholder': 'Confirm your new password',
      'accountSettings.updatePassword': 'Update Password',
      'accountSettings.passwordsDoNotMatch': 'New passwords do not match',
      'accountSettings.passwordTooShort': 'Password must be at least 6 characters long',
      'accountSettings.passwordUpdated': 'Password updated successfully',
      'accountSettings.dangerZone': 'Danger Zone',
      'accountSettings.dangerZoneDescription': 'Permanently delete your account and all associated data. This action cannot be undone.',
      'accountSettings.deleteAccount': 'Delete Account',
      'accountSettings.deleteConfirmTitle': 'Are you absolutely sure?',
      'accountSettings.deleteConfirmDescription': 'This action cannot be undone. This will permanently delete your account and remove all your data from our servers.',
      'accountSettings.deleteConfirmInstructions': 'To confirm, type DELETE in the box below:',
      'accountSettings.deleteConfirmPlaceholder': 'Type DELETE to confirm',
      'accountSettings.cancel': 'Cancel',
      'accountSettings.deleting': 'Deleting...',
      'accountSettings.deleteConfirmationError': 'Please type \'DELETE\' to confirm account deletion',
      'accountSettings.accountDeleted': 'Account Deleted',
      'accountSettings.accountDeletedDescription': 'Your account has been permanently deleted. You can register again with the same email if needed.',
      'accountSettings.error': 'Error',
      'accountSettings.success': 'Success',
      'accountSettings.failedToUpdateEmail': 'Failed to update email',
      'accountSettings.failedToUpdatePassword': 'Failed to update password',
      'accountSettings.failedToDeleteAccount': 'Failed to delete account',

      // Restaurant Setup
      'restaurant.updateProfile': 'Update Restaurant Profile',
      'restaurant.completeProfile': 'Complete Your Restaurant Profile',
      'restaurant.updateInformation': 'Update your restaurant information',
      'restaurant.tellUsAbout': 'Tell us about your restaurant to get started with ThinkPost',
      'restaurant.name': 'Restaurant Name',
      'restaurant.enterName': 'Enter your restaurant name',
      'restaurant.location': 'Location',
      'restaurant.locationPlaceholder': 'e.g., Riyadh, Saudi Arabia',
      'restaurant.category': 'Category',
      'restaurant.selectCategory': 'Select restaurant category',
      'restaurant.vision': 'Restaurant Vision',
      'restaurant.visionPlaceholder': 'Describe your restaurant\'s vision, style, and what makes it special...',
      'restaurant.cancel': 'Cancel',
      'restaurant.updating': 'Updating...',
      'restaurant.creating': 'Creating...',
      'restaurant.updateButton': 'Update Profile',
      'restaurant.completeSetup': 'Complete Setup',
      'restaurant.success': 'Success!',
      'restaurant.profileUpdated': 'Restaurant profile updated successfully',
      'restaurant.profileCreated': 'Restaurant profile created successfully',
      'restaurant.error': 'Error',
      'restaurant.failedToLoad': 'Failed to load restaurant data',
      'restaurant.failedToSave': 'Failed to save restaurant profile',

      // Scheduled Posts
      'schedule.title': 'Scheduled Posts',
      'schedule.description': 'Schedule and manage your social media posts',
      'schedule.schedulePosts': 'Schedule Posts',
      'schedule.noPosts': 'No posts scheduled for this date',
      'schedule.deleteAll': 'Delete All Scheduled Tasks',
      'schedule.editDate': 'Edit Date',
      'schedule.delete': 'Delete',
      'schedule.cancel': 'Cancel',
      'schedule.needContent': 'You need products or images with captions to schedule posts',
      'schedule.dailyView': 'Daily View',
      'schedule.weeklyView': 'Weekly View',
      'schedule.calendar': 'Calendar',

      // Notifications
      'notifications.title': 'Notifications',
      'notifications.description': 'Choose what notifications you want to receive',
      'notifications.noNotifications': 'No notifications yet',
      'notifications.markAsRead': 'Mark as read',
      'notifications.delete': 'Delete',
      'notifications.captionGenerated': 'Caption Generated',
      'notifications.uploadFailed': 'Upload Failed',
      'notifications.uploadStatus': 'Upload Status',
      'notifications.captionSettings': 'Get notified when AI captions are generated',

      // Image Upload Page
      'upload.backToDashboard': 'Back to Dashboard',
      'upload.title': 'Upload Images',
      'upload.description': 'Upload photos of your delicious dishes to generate AI-powered captions',
      'upload.selectImages': 'Select Images',
      'upload.selectImagesDescription': 'Choose multiple images to upload. Supported formats: JPG, PNG, WEBP',
      'upload.clickToUpload': 'Click to upload images',
      'upload.dragAndDrop': 'or drag and drop your files here',
      'upload.selectedImages': 'Selected Images',
      'upload.uploadButton': 'Upload {count} Image(s)',
      'upload.uploading': 'Uploading...',
      'upload.clearAll': 'Clear All',
      'upload.uploadSuccess': 'Success!',
      'upload.uploadSuccessDescription': '{count} image(s) uploaded successfully',
      'upload.uploadFailed': 'Upload Failed',
      'upload.uploadFailedDescription': 'Failed to upload images',
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
      
      // Hero - Updated with new content
      'hero.badge': 'إنتاج محتوى بالذكاء الاصطناعي',
      'hero.title.transform': 'خلّ محتواك يشبهك',
      'hero.title.contentStrategy': 'وخل الذكاء الاصطناعي يساعدك في الانتشار',
      'hero.subtitle': 'منصة تسويقية ذكية للمطاعم والكافيهات وغيرها، تولّد لك محتوى متناسق مع هوية مشروعك، وتجدوله وتنزله في السوشال ميديا – كل هذا بثواني!',
      'hero.description': 'أنشئ محتوى جذاب وعالي الجودة مع منصتنا المتخصصة في انشاء المحتوى وجدولته ونشره في منصات التواصل الاجتماعي. عزز إنتاجيتك وبأفكار متجددة وكثيرة وبأسلوب يعكس هويتك.',
      'hero.startCreating': 'ابدأ مجاناً',
      'hero.watchDemo': 'شاهد العرض التوضيحي',
      'hero.goToDashboard': 'اذهب إلى لوحة التحكم',
      'hero.loading': 'جارٍ التحميل...',
      'hero.demoTitle': 'فيديو العرض التوضيحي قريباً',
      'hero.demoDescription': 'شاهد نموذج العمل',
      
      // Features
      'features.title.powerful': 'مميزات قوية',
      'features.title.creators': 'لمن يريد انشاء محتوى',
      'features.description': 'كل ما تحتاجه لإنشاء وتحسين وتوسيع استراتيجية المحتوى الخاصة بك بقوة الذكاء الاصطناعي.',
      'features.feature1.title': 'توليد مدعوم بالذكاء الاصطناعي',
      'features.feature1.description': 'خوارزميات متقدمة تنشئ محتوى مخصص لصوت علامتك التجارية وأسلوبك.',
      'features.feature2.title': 'سرعة البرق',
      'features.feature2.description': 'انتج محتوى عالي الجودة في ثوانٍ وليس ساعات. عزز إنتاجيتك فوراً.',
      'features.feature3.title': 'محتوى مستهدف',
      'features.feature3.description': 'أنشئ محتوى محسّن لجمهورك المحدد وأهدافك التسويقية.',
      'features.feature4.title': 'ضمان الجودة',
      'features.feature4.description': 'فحوصات جودة مدمجة تضمن أن محتواك يلبي أعلى المعايير.',
      'features.feature5.title': 'متعدد اللغات',
      'features.feature5.description': 'انتج محتوى بأكثر لغة للوصول إلى جمهور عالمي.',
      'features.feature6.title': 'محسّن لمحركات البحث',
      'features.feature6.description': 'محتوى محسّن تلقائياً لمحركات البحث لتعزيز ترتيبك.',
      
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

      // Pricing
      'pricing.title': 'الأسعار',
      'pricing.subtitle': 'اختر الخطة المثالية لعملك. جميع الخطط تشمل ميزات الذكاء الاصطناعي الأساسية.',
      'pricing.mostPopular': 'الأكثر شعبية',
      'pricing.plans.free.name': 'مجاني',
      'pricing.plans.free.period': '/شهر',
      'pricing.plans.free.description': 'مثالي للبداية',
      'pricing.plans.free.features.posts': '١٤ منشور شهرياً',
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
      'pricing.plans.pro.features.arabic': 'دعم اللهجة السعودية',
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
      'faq.questions.q2.answer': 'حاليا ندعم منصة TikTok فقط. مع العمل على توسيع الدعم لمنصات أخرى في المستقبل.',
      'faq.questions.q3.question': 'هل يمكنني تخصيص وتعديل المحتوى المولد؟',
      'faq.questions.q3.answer': 'بالطبع! منصتنا توفر نقطة بداية رائعة، لكن لديك القدرة الكاملة لتحرير أو تعديل أو إعادة كتابة أي محتوى منتج بالكامل. يمكنك أيضاً تعيين تفضيلات للنبرة والأسلوب وكلمات مفتاحية محددة.',
      'faq.questions.q4.question': 'ما مدى دقة دعم اللهجة العربية؟',
      'faq.questions.q4.answer': 'ذكاؤنا الاصطناعي مدرب خصيصاً على اللهجات العربية السعودية والفروق الثقافية. يفهم التعبيرات المحلية والمراجع الثقافية وينشئ محتوى أصيل يتردد صداه مع الجماهير الناطقة بالعربية.',
      'faq.questions.q5.question': 'هل هناك تجربة مجانية متاحة؟',
      'faq.questions.q5.answer': 'نعم! خطتنا المجانية تشمل ١٤ منشور شهرياً مع تسميات توضيحية أساسية بالذكاء الاصطناعي لمنصتين اجتماعيتين. يمكنك الترقية في أي وقت للوصول إلى المزيد من الميزات والحدود الأعلى.',
      'faq.questions.q6.question': 'هل يمكنني جدولة المنشورات لوقت لاحق؟',
      'faq.questions.q6.answer': 'نعم، مع خططنا الاحترافية والتجارية، تحصل على الوصول إلى أدوات الجدولة لدينا. يمكنك التخطيط لتقويم المحتوى الخاص بك ونشر المنشورات تلقائياً في الأوقات المثلى لأقصى تفاعل.',
      'faq.questions.q7.question': 'ما هي تنسيقات الملفات التي تدعمونها؟',
      'faq.questions.q7.answer': 'ندعم جميع تنسيقات الصور الرئيسية (JPG، PNG، GIF، WebP). نظامنا يحسن محتواك تلقائياً لمتطلبات كل منصة.',
      'faq.questions.q8.question': 'ما مدى أمان محتواي؟',
      'faq.questions.q8.answer': 'نأخذ الأمان على محمل الجد. جميع التحميلات مشفرة، ولا نخزن محتواك أطول من اللازم..',
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
      
      // Dashboard
      'dashboard.loading': 'جارٍ تحميل لوحة التحكم...',
      'dashboard.tabs.overview': 'نظرة عامة',
      'dashboard.tabs.media': 'الوسائط',
      'dashboard.tabs.captions': 'توليد المحتوى',
      'dashboard.tabs.schedule': 'الجدولة',
      'dashboard.tabs.notifications': 'الإشعارات',
      
      // Overview Cards
      'dashboard.overview.totalPosts': 'إجمالي المنشورات',
      'dashboard.overview.totalPostsSubtext': '+12% من الشهر الماضي',
      'dashboard.overview.upcomingPosts': 'المنشورات القادمة',
      'dashboard.overview.upcomingPostsSubtext': 'مجدولة هذا الأسبوع',
      'dashboard.overview.captionCredits': 'رصيد توليد المحتوى',
      'dashboard.overview.captionCreditsSubtext': '{credits} رصيد متبقي',
      'dashboard.overview.mediaLibrary': 'مكتبة الوسائط',
      'dashboard.overview.mediaLibrarySubtext': 'صور مرفوعة',
      
      // Quick Actions
      'dashboard.quickActions.title': 'إجراءات سريعة',
      'dashboard.quickActions.addProducts': 'ابدأ وأضف منتجات',
      'dashboard.quickActions.viewCaptions': 'عرض المحتويات التي تم توليدها',
      'dashboard.quickActions.schedulePost': 'جدولة منشور',
      
      // TikTok Connection
      'dashboard.tiktok.title': 'اتصال TikTok',
      'dashboard.tiktok.description': 'اربط حساب تيك توك الخاص بك لجدولة ونشر المحتوى مباشرة',
      'dashboard.tiktok.connectedAs': 'متصل باسم @{username}',
      'dashboard.tiktok.connectedStatus': 'متصل بـ TikTok',
      'dashboard.tiktok.disconnect': 'قطع الاتصال مع TikTok',
      'dashboard.tiktok.connectDescription': 'اربط حسابك في TikTok للوصول إلى ميزات إضافية وتحسين إنشاء المحتوى.',
      'dashboard.tiktok.connecting': 'جارٍ الاتصال...',
      'dashboard.tiktok.connect': 'اربط TikTok',
      
      // User Profile
      'dashboard.profile.owner': 'المالك',
      'dashboard.profile.profileSettings': 'إعدادات الملف الشخصي',
      'dashboard.profile.accountSettings': 'إعدادات الحساب',
      'dashboard.profile.signOut': 'تسجيل الخروج',
      
      // Media Management
      'media.title': 'إدارة الوسائط',
      'media.description': 'إدارة الصور والمنتجات المرفوعة',
      'media.addProducts': 'إضافة منتجات',
      'media.selectAll': 'تحديد جميع المنتجات',
      'media.cancelSelection': 'إلغاء التحديد',
      'media.deleteSelected': 'حذف المحدد ({count})',
      'media.deleteAll': 'حذف جميع المنتجات',
      'media.noMedia': 'لم يتم رفع وسائط بعد',
      'media.noFilter': 'لا توجد {filter}',
      'media.viewGrid': 'عرض الشبكة',
      'media.viewList': 'عرض القائمة',
      'media.filterAll': 'الكل',
      'media.filterImages': 'الصور',
      'media.filterProducts': 'المنتجات',
      'media.filterWithCaptions': 'مع تسميات توضيحية',
      'media.filterWithoutCaptions': 'بدون تسميات توضيحية',

      // Generated Captions
      'captions.title': 'توليد المحتوى',
      'captions.description': 'إدارة المحتوى المولد بالذكاء الاصطناعي للصور والمنتجات',
      'captions.regenerate': 'إعادة توليد المحتوى',
      'captions.noCredits': 'لا توجد رصيد كافي لتوليد المحتوى',
      'captions.generating': 'جارٍ التوليد...',
      'captions.generated': 'تم توليد المحتوى بنجاح',
      'captions.failed': 'فشل في توليد المحتوى',
      'captions.noContent': 'لا يوجد محتوى بعد',
      'captions.addProducts': 'أضف منتجات مع صور لتوليد محتوى بالذكاء الاصطناعي',
      'captions.addFirst': 'أضف أول منتج',
      'captions.addMore': 'إضافة المزيد من المحتوى',

      // Table Headers
      'table.content': 'المحتوى',
      'table.caption': 'التسمية',
      'table.details': 'التفاصيل',
      'table.status': 'الحالة',
      'table.performance': 'الأداء',
      'table.actions': 'الإجراءات',

      // Authentication
      'auth.welcomeBack': 'أهلاً بعودتك',
      'auth.signInToAccount': 'سجل دخولك إلى حساب ThinkPost',
      'auth.emailConfirmationRequired': 'تأكيد البريد الإلكتروني مطلوب:',
      'auth.checkEmailConfirmation': 'يرجى التحقق من صندوق البريد الإلكتروني والنقر على رابط التأكيد. إذا لم تجد البريد، تحقق من مجلد الرسائل غير المرغوب فيها.',
      'auth.invalidCredentials': 'بريد إلكتروني أو كلمة مرور غير صحيحة. يرجى التحقق من بياناتك والمحاولة مرة أخرى.',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.enterEmail': 'أدخل بريدك الإلكتروني',
      'auth.enterPassword': 'أدخل كلمة المرور',
      'auth.forgotPassword': 'نسيت كلمة المرور؟',
      'auth.signIn': 'تسجيل الدخول',
      'auth.signingIn': 'جارٍ تسجيل الدخول...',
      'auth.signUp': 'إنشاء حساب',
      'auth.dontHaveAccount': 'ليس لديك حساب؟',
      'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
      'auth.joinThinkPost': 'انضم إلى ThinkPost',
      'auth.createAccountToStart': 'أنشئ حسابك للبدء',
      'auth.fullName': 'الاسم الكامل',
      'auth.enterFullName': 'أدخل اسمك الكامل',
      'auth.createStrongPassword': 'أنشئ كلمة مرور قوية',
      'auth.confirmPassword': 'تأكيد كلمة المرور',
      'auth.confirmYourPassword': 'أكد كلمة المرور',
      'auth.agreeToTerms': 'بإنشاء الحساب، فإنك توافق على',
      'auth.termsOfService': 'شروط الخدمة',
      'auth.and': 'و',
      'auth.privacyPolicy': 'سياسة الخصوصية',
      'auth.createAccount': 'إنشاء حساب',
      'auth.creatingAccount': 'جارٍ إنشاء الحساب...',

      // Account Settings
      'accountSettings.title': 'إعدادات الحساب',
      'accountSettings.description': 'إدارة التفضيلات وإعدادات الأمان',
      'accountSettings.back': 'رجوع',
      'accountSettings.currentAccount': 'الحساب الحالي',
      'accountSettings.emailAddress': 'البريد الإلكتروني',
      'accountSettings.changeEmail': 'تغيير البريد الإلكتروني',
      'accountSettings.changeEmailDescription': 'قم بتحديث عنوان بريدك الإلكتروني. ستحتاج إلى تأكيد عنواني بريدك الجديد والقديم.',
      'accountSettings.newEmailAddress': 'عنوان بريد جديد',
      'accountSettings.enterNewEmail': 'أدخل عنوان بريدك الجديد',
      'accountSettings.updateEmail': 'تحديث البريد الإلكتروني',
      'accountSettings.updating': 'جارٍ التحديث...',
      'accountSettings.emailUpdateRequested': 'طلب تحديث البريد الإلكتروني',
      'accountSettings.emailUpdateDescription': 'يرجى التحقق من عنواني بريدك القديم والجديد لروابط التأكيد.',
      'accountSettings.changePassword': 'تغيير كلمة المرور',
      'accountSettings.changePasswordDescription': 'قم بتحديث كلمة المرور لضمان أمان حسابك.',
      'accountSettings.newPassword': 'كلمة مرور جديدة',
      'accountSettings.enterNewPassword': 'أدخل كلمة المرور الجديدة',
      'accountSettings.confirmNewPassword': 'تأكيد كلمة المرور الجديدة',
      'accountSettings.confirmNewPasswordPlaceholder': 'تأكيد كلمة المرور الجديدة',
      'accountSettings.updatePassword': 'تحديث كلمة المرور',
      'accountSettings.passwordsDoNotMatch': 'كلمات المرور غير متطابقة',
      'accountSettings.passwordTooShort': 'يجب أن تكون كلمة المرور على الأقل 6 أحرف طويلة',
      'accountSettings.passwordUpdated': 'تم تحديث كلمة المرور بنجاح',
      'accountSettings.dangerZone': 'الحذف',
      'accountSettings.dangerZoneDescription': 'حذف حسابك وكل البيانات المرتبطة به بشكل دائم. هذه العملية غير قابلة للتراجع.',
      'accountSettings.deleteAccount': 'حذف الحساب',
      'accountSettings.deleteConfirmTitle': 'هل أنت متأكد بأكمله؟',
      'accountSettings.deleteConfirmDescription': 'هذه العملية غير قابلة للتراجع. سيتم حذف حسابك وإزالة جميع بياناتك من خوادمنا بشكل دائم.',
      'accountSettings.deleteConfirmInstructions': 'لتأكيد، أدخل DELETE في المربع أدناه:',
      'accountSettings.deleteConfirmPlaceholder': 'أدخل DELETE لتأكيد حذف الحساب',
      'accountSettings.cancel': 'إلغاء',
      'accountSettings.deleting': 'جارٍ الحذف...',
      'accountSettings.deleteConfirmationError': 'يرجى إدخال \'DELETE\' لتأكيد حذف الحساب',
      'accountSettings.accountDeleted': 'تم حذف الحساب',
      'accountSettings.accountDeletedDescription': 'تم حذف حسابك بشكل دائم. يمكنك التسجيل مرة أخرى بنفس بريدك الإلكتروني إذا كان ذلك ضروريًا.',
      'accountSettings.error': 'خطأ',
      'accountSettings.success': 'نجاح',
      'accountSettings.failedToUpdateEmail': 'فشل تحديث عنوان البريد الإلكتروني',
      'accountSettings.failedToUpdatePassword': 'فشل تحديث كلمة المرور',
      'accountSettings.failedToDeleteAccount': 'فشل حذف الحساب',

      // Restaurant Setup
      'restaurant.updateProfile': 'تحديث ملف المطعم',
      'restaurant.completeProfile': 'أكمل ملف مطعمك',
      'restaurant.updateInformation': 'حدث معلومات مطعمك',
      'restaurant.tellUsAbout': 'أخبرنا عن مطعمك للبدء مع ThinkPost',
      'restaurant.name': 'اسم المطعم',
      'restaurant.enterName': 'أدخل اسم مطعمك',
      'restaurant.location': 'الموقع',
      'restaurant.locationPlaceholder': 'مثال: الرياض، المملكة العربية السعودية',
      'restaurant.category': 'الفئة',
      'restaurant.selectCategory': 'اختر فئة المطعم',
      'restaurant.vision': 'رؤية المطعم',
      'restaurant.visionPlaceholder': 'صف رؤية مطعمك وأسلوبه وما يميزه...',
      'restaurant.cancel': 'إلغاء',
      'restaurant.updating': 'جارٍ التحديث...',
      'restaurant.creating': 'جارٍ الإنشاء...',
      'restaurant.updateButton': 'تحديث الملف',
      'restaurant.completeSetup': 'إكمال الإعداد',
      'restaurant.success': 'نجح!',
      'restaurant.profileUpdated': 'تم تحديث ملف المطعم بنجاح',
      'restaurant.profileCreated': 'تم إنشاء ملف المطعم بنجاح',
      'restaurant.error': 'خطأ',
      'restaurant.failedToLoad': 'فشل في تحميل بيانات المطعم',
      'restaurant.failedToSave': 'فشل في حفظ ملف المطعم',

      // Scheduled Posts
      'schedule.title': 'المنشورات المجدولة',
      'schedule.description': 'جدولة وإدارة منشوراتك على وسائل التواصل الاجتماعي',
      'schedule.schedulePosts': 'جدولة المنشورات',
      'schedule.noPosts': 'لا توجد منشورات مجدولة لهذا التاريخ',
      'schedule.deleteAll': 'حذف جميع المهام المجدولة',
      'schedule.editDate': 'تعديل التاريخ',
      'schedule.delete': 'حذف',
      'schedule.cancel': 'إلغاء',
      'schedule.needContent': 'تحتاج إلى منتجات أو صور مع تسميات توضيحية لجدولة المنشورات',
      'schedule.dailyView': 'العرض اليومي',
      'schedule.weeklyView': 'العرض الأسبوعي',
      'schedule.calendar': 'التقويم',

      // Notifications
      'notifications.title': 'الإشعارات',
      'notifications.description': 'اختر الإشعارات التي تريد استقبالها',
      'notifications.noNotifications': 'لا توجد إشعارات بعد',
      'notifications.markAsRead': 'تحديد كمقروء',
      'notifications.delete': 'حذف',
      'notifications.captionGenerated': 'تم توليد المحتوى',
      'notifications.uploadFailed': 'فشل الرفع',
      'notifications.uploadStatus': 'حالة الرفع',
      'notifications.captionSettings': 'احصل على إشعار عند توليد محتوى بالذكاء الاصطناعي',

      // Image Upload Page
      'upload.backToDashboard': 'العودة إلى لوحة التحكم',
      'upload.title': 'رفع الصور',
      'upload.description': 'ارفع صور أطباقك اللذيذة لإنتاج تسميات توضيحية بالذكاء الاصطناعي',
      'upload.selectImages': 'اختر الصور',
      'upload.selectImagesDescription': 'اختر عدة صور للرفع. التنسيقات المدعومة: JPG، PNG، WEBP',
      'upload.clickToUpload': 'انقر لرفع الصور',
      'upload.dragAndDrop': 'أو اسحب وأفلت ملفاتك هنا',
      'upload.selectedImages': 'الصور المختارة',
      'upload.uploadButton': 'رفع {count} صورة',
      'upload.uploading': 'جارٍ الرفع...',
      'upload.clearAll': 'مسح الكل',
      'upload.uploadSuccess': 'نجح!',
      'upload.uploadSuccessDescription': 'تم رفع {count} صورة بنجاح',
      'upload.uploadFailed': 'فشل الرفع',
      'upload.uploadFailedDescription': 'فشل في رفع الصور',
    }
  };
};
