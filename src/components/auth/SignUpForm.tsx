
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

const restaurantCategories: { value: RestaurantCategory; label: string }[] = [
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'casual_dining', label: 'Casual Dining' },
  { value: 'fine_dining', label: 'Fine Dining' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'asian', label: 'Asian' },
  { value: 'italian', label: 'Italian' },
  { value: 'american', label: 'American' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'indian', label: 'Indian' },
  { value: 'other', label: 'Other' }
];

interface SignUpFormProps {
  onSuccess?: () => void;
}

const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [restaurantCategory, setRestaurantCategory] = useState<RestaurantCategory | ''>('');
  const [restaurantVision, setRestaurantVision] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!restaurantCategory) {
      alert('Please select a restaurant category');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, name, {
      restaurantName,
      restaurantLocation,
      restaurantCategory,
      restaurantVision
    });
    
    setIsLoading(false);
    
    if (!error) {
      onSuccess?.();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-deep-blue dark:text-white">
          Join ThinkPost
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Create your account and restaurant profile
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-deep-blue dark:text-white font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-deep-blue dark:text-white font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-deep-blue dark:text-white font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-deep-blue dark:text-white font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white">Restaurant Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-deep-blue dark:text-white font-medium">
                  Restaurant Name *
                </Label>
                <Input
                  id="restaurantName"
                  type="text"
                  placeholder="Enter your restaurant name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantLocation" className="text-deep-blue dark:text-white font-medium">
                  Location *
                </Label>
                <Input
                  id="restaurantLocation"
                  type="text"
                  placeholder="e.g., Riyadh, Saudi Arabia"
                  value={restaurantLocation}
                  onChange={(e) => setRestaurantLocation(e.target.value)}
                  required
                  className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantCategory" className="text-deep-blue dark:text-white font-medium">
                  Category *
                </Label>
                <Select value={restaurantCategory} onValueChange={(value: RestaurantCategory) => setRestaurantCategory(value)}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400">
                    <SelectValue placeholder="Select restaurant category" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantVision" className="text-deep-blue dark:text-white font-medium">
                  Restaurant Vision
                </Label>
                <Textarea
                  id="restaurantVision"
                  placeholder="Describe your restaurant's vision, style, and what makes it special..."
                  value={restaurantVision}
                  onChange={(e) => setRestaurantVision(e.target.value)}
                  rows={3}
                  className="border-gray-300 dark:border-gray-600 focus:border-vibrant-purple dark:focus:border-purple-400 resize-none"
                />
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
              By signing up, you agree to our{' '}
              <a href="#" className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-vibrant-purple hover:text-deep-blue dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                Privacy Policy
              </a>
            </div>
          </form>
        </ScrollArea>
        
        <div className="px-6 pb-6 pt-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
          <Button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-2.5"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
