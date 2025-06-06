
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: RestaurantCategory;
  vision?: string;
}

interface RestaurantFormProps {
  restaurant: Restaurant | null;
}

const RestaurantForm = ({ restaurant }: RestaurantFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    location: '',
    category: '' as RestaurantCategory | '',
    vision: ''
  });

  useEffect(() => {
    if (restaurant) {
      setRestaurantData({
        name: restaurant.name || '',
        location: restaurant.location || '',
        category: restaurant.category || '',
        vision: restaurant.vision || ''
      });
    }
  }, [restaurant]);

  const handleInputChange = (field: string, value: string) => {
    setRestaurantData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !restaurantData.category) return;

    setIsLoading(true);

    try {
      if (restaurant) {
        // Update existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: restaurantData.name,
            location: restaurantData.location,
            category: restaurantData.category as RestaurantCategory,
            vision: restaurantData.vision
          })
          .eq('id', restaurant.id);

        if (error) throw error;

        toast({
          title: "Restaurant Updated",
          description: "Your restaurant information has been updated successfully.",
        });
      } else {
        // Create new restaurant
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user.id,
            name: restaurantData.name,
            location: restaurantData.location,
            category: restaurantData.category as RestaurantCategory,
            vision: restaurantData.vision
          });

        if (error) throw error;

        toast({
          title: "Restaurant Created",
          description: "Your restaurant has been created successfully.",
        });
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to save restaurant information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { value: RestaurantCategory; label: string }[] = [
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Restaurant Name */}
      <div>
        <Label htmlFor="restaurant_name">Restaurant Name</Label>
        <Input
          id="restaurant_name"
          type="text"
          value={restaurantData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter restaurant name"
          className="mt-1"
          required
        />
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          value={restaurantData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Enter restaurant location"
          className="mt-1"
          required
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={restaurantData.category}
          onValueChange={(value: RestaurantCategory) => handleInputChange('category', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select restaurant category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vision */}
      <div>
        <Label htmlFor="vision">Restaurant Vision</Label>
        <Textarea
          id="vision"
          value={restaurantData.vision}
          onChange={(e) => handleInputChange('vision', e.target.value)}
          placeholder="Describe your restaurant's vision and goals..."
          className="mt-1"
          rows={4}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-primary hover:opacity-90"
      >
        {isLoading ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
      </Button>
    </form>
  );
};

export default RestaurantForm;
