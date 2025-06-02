
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfilePanel from '@/components/dashboard/UserProfilePanel';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  vision?: string;
}

interface DashboardHeaderProps {
  restaurant: Restaurant;
}

const DashboardHeader = ({ restaurant }: DashboardHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/6c4dfede-77fa-46ae-85b5-08890b6f7af5.png" 
              alt="ThinkPost" 
              className="h-8 w-8"
            />
            <h1 className="text-2xl font-bold text-deep-blue dark:text-white">
              {restaurant.name} Dashboard
            </h1>
          </div>
          <UserProfilePanel restaurant={restaurant} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
