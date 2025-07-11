
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import AuthDialog from '@/components/auth/AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const navLinks = [
    { name: t('nav.features'), href: '#features' },
    { name: t('nav.howItWorks'), href: '#how-it-works' },
    { name: t('nav.contact'), href: '#contact' },
  ];

  const openAuthDialog = () => {
    setIsAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="p-1">
                <img 
                  src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
                  alt="ThinkPost Logo" 
                  className="h-10 w-10"
                />
              </div>
              <span className="text-xl font-bold text-deep-blue dark:text-white">ThinkPost</span>
            </div>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center space-x-8 ${isRTL ? 'space-x-reverse' : ''}`}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-deep-blue dark:hover:text-white transition-colors duration-200 font-medium"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Desktop Auth Buttons and Theme Toggle */}
            <div className={`hidden md:flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <LanguageToggle />
              <ThemeToggle />
              {user ? (
                <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t('header.welcomeBack')}
                  </span>
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="text-deep-blue dark:text-white hover:bg-deep-blue/10 dark:hover:bg-white/10"
                  >
                    {t('header.signOut')}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={openAuthDialog}
                  className="bg-gradient-primary hover:opacity-90 text-white"
                >
                  {t('header.getStarted')}
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className={`md:hidden flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <LanguageToggle />
              <ThemeToggle />
              <button
                className="p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-deep-blue dark:text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-deep-blue dark:text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-deep-blue dark:hover:text-white transition-colors duration-200 font-medium px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex flex-col space-y-2 pt-4">
                  {user ? (
                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                        {t('header.welcomeBack')}
                      </span>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="text-deep-blue dark:text-white hover:bg-deep-blue/10 dark:hover:bg-white/10 w-full"
                      >
                        {t('header.signOut')}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => {
                        openAuthDialog();
                        setIsMenuOpen(false);
                      }}
                      className="bg-gradient-primary hover:opacity-90 text-white w-full"
                    >
                      {t('header.getStarted')}
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Authentication Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        defaultTab="signup"
      />
    </>
  );
};

export default Header;
