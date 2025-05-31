
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const restaurantCategories = [
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

const RestaurantSetup = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    category: '',
    vision: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      checkExistingRestaurant();
    }
  }, [user, loading, navigate]);

  const checkExistingRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          location: data.location,
          category: data.category,
          vision: data.vision || ''
        });
        setIsEditing(true);
        setRestaurantId(data.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && restaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: formData.name,
            location: formData.location,
            category: formData.category,
            vision: formData.vision || null
          })
          .eq('id', restaurantId);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Restaurant profile updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user?.id,
            name: formData.name,
            location: formData.location,
            category: formData.category,
            vision: formData.vision || null
          });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Restaurant profile created successfully"
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save restaurant profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-deep-blue dark:text-white">
              {isEditing ? 'Update Restaurant Profile' : 'Complete Your Restaurant Profile'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update your restaurant information'
                : 'Tell us about your restaurant to get started with ThinkPost.ai'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your restaurant name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Riyadh, Saudi Arabia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="vision">Restaurant Vision</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Describe your restaurant's vision, style, and what makes it special..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Profile' : 'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantSetup;
