
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-deep-blue">ThinkPost.ai</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-deep-blue transition-colors duration-200 font-medium"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-deep-blue hover:bg-deep-blue/10">
              Sign In
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90 text-white">
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-deep-blue" />
            ) : (
              <Menu className="h-6 w-6 text-deep-blue" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-600 hover:text-deep-blue transition-colors duration-200 font-medium px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="text-deep-blue hover:bg-deep-blue/10 w-full">
                  Sign In
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90 text-white w-full">
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
