import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfilePanel from '@/components/dashboard/UserProfilePanel';
import LanguageToggle from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  vision?: string;
}

interface DashboardHeaderProps {
  restaurant: Restaurant | null;
}

const DashboardHeader = ({ restaurant }: DashboardHeaderProps) => {
  const { isRTL } = useLanguage();

  console.log('DashboardHeader rendering with restaurant:', restaurant);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-4' : 'space-x-4'}`}>
            <img 
              src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
              alt="ThinkPost" 
              className="h-8 w-8"
            />
            <h1 className="text-2xl font-bold text-deep-blue dark:text-white">
              {restaurant ? `${restaurant.name} Dashboard` : 'Dashboard'}
            </h1>
          </div>
          
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LanguageToggle />
            <ThemeToggle />
            <UserProfilePanel restaurant={restaurant} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
