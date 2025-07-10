import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  vision?: string;
}

interface UserProfilePanelProps {
  restaurant: Restaurant | null;
}

const UserProfilePanel = ({ restaurant }: UserProfilePanelProps) => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get display name - prefer user's full name, fallback to email
  const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';
  // Get initials from user's name, not restaurant name
  const displayInitials = getInitials(userDisplayName);

  console.log('UserProfilePanel - user:', user?.user_metadata, 'restaurant:', restaurant);

  return (
    <div className="flex items-center space-x-4">
      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-3 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-vibrant-purple text-white">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-deep-blue dark:text-white">
                {userDisplayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {restaurant ? `Owner of ${restaurant.name}` : t('dashboard.profile.owner')}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userDisplayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              {restaurant && (
                <p className="text-xs leading-none text-muted-foreground">
                  {restaurant.name} - {restaurant.category}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile-settings')}>
            <User className="mr-2 h-4 w-4" />
            {t('dashboard.profile.profileSettings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/account-settings')}>
            <Settings className="mr-2 h-4 w-4" />
            {t('dashboard.profile.accountSettings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            {t('dashboard.profile.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfilePanel;
