
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const footerLinks = {
    product: [
      { name: t('footer.product.features'), href: '#features' },
      { name: t('footer.product.pricing'), href: '#pricing' },
      { name: t('footer.product.api'), href: '#' },
      { name: t('footer.product.documentation'), href: '#' }
    ],
    company: [
      { name: t('footer.company.about'), href: '#' },
      { name: t('footer.company.careers'), href: '#' },
      { name: t('footer.company.press'), href: '#' },
      { name: t('footer.company.contact'), href: '#contact' }
    ],
    support: [
      { name: t('footer.support.helpCenter'), href: '#' },
      { name: t('footer.support.community'), href: '#' },
      { name: t('footer.support.status'), href: '#' },
      { name: t('footer.support.security'), href: '#' }
    ],
    legal: [
      { name: t('footer.legal.privacy'), href: '/privacy' },
      { name: t('footer.legal.terms'), href: '/terms' },
      { name: t('footer.legal.cookies'), href: '#' },
      { name: t('footer.legal.gdpr'), href: '#' }
    ]
  };

  return (
    <footer className="bg-deep-blue dark:bg-gray-900 text-white dark:text-gray-300 transition-colors">
      <div className="container mx-auto px-4 lg:px-6 py-16">
        {/* Newsletter Section */}
        <div className="bg-gradient-primary/10 dark:bg-gradient-primary/20 rounded-2xl p-8 mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">{t('footer.newsletter.title')}</h3>
            <p className="text-gray-300 dark:text-gray-400 mb-6">
              {t('footer.newsletter.description')}
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 max-w-md mx-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="bg-white/10 dark:bg-gray-800/50 border-white/20 dark:border-gray-600 text-white dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-400"
              />
              <Button className="bg-white text-deep-blue hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                {t('footer.newsletter.buttonText')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Logo and Description */}
          <div className={`lg:col-span-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
              <img 
                src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
                alt="ThinkPost Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">ThinkPost</span>
            </div>
            <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-sm">
              {t('footer.description')}
            </p>
            <div className={`flex space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse justify-end' : ''}`}>
              <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.sections.product')}</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.sections.company')}</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.sections.support')}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.sections.legal')}</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.name === t('footer.legal.privacy') || link.name === t('footer.legal.terms') ? (
                    <Link to={link.href} className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                      {link.name}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/20 dark:bg-gray-700" />

        {/* Bottom Section */}
        <div className={`flex flex-col md:flex-row justify-between items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <p className="text-gray-300 dark:text-gray-400 text-sm">
            {t('footer.copyright')}
          </p>
          <div className={`flex space-x-6 mt-4 md:mt-0 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Link to="/privacy" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 text-sm transition-colors">
              {t('footer.bottomLinks.privacy')}
            </Link>
            <Link to="/terms" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 text-sm transition-colors">
              {t('footer.bottomLinks.terms')}
            </Link>
            <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 text-sm transition-colors">
              {t('footer.bottomLinks.cookies')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
