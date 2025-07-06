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
import { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Saudi regions data
const regions = {
  en: [
    "Riyadh",
    "Makkah", 
    "Madinah",
    "Qassim",
    "Eastern Province",
    "Asir",
    "Tabuk",
    "Hail",
    "Northern Borders",
    "Jazan",
    "Najran",
    "Al Bahah",
    "Al Jouf"
  ],
  ar: [
    "الرياض",
    "مكة المكرمة",
    "المدينة المنورة", 
    "القصيم",
    "المنطقة الشرقية",
    "عسير",
    "تبوك",
    "حائل",
    "الحدود الشمالية",
    "جازان",
    "نجران",
    "الباحة",
    "الجوف"
  ]
};

// Map Arabic regions to English for database storage
const regionMapping: { [key: string]: string } = {
  "الرياض": "Riyadh",
  "مكة المكرمة": "Makkah",
  "المدينة المنورة": "Madinah",
  "القصيم": "Qassim",
  "المنطقة الشرقية": "Eastern Province",
  "عسير": "Asir",
  "تبوك": "Tabuk",
  "حائل": "Hail",
  "الحدود الشمالية": "Northern Borders",
  "جازان": "Jazan",
  "نجران": "Najran",
  "الباحة": "Al Bahah",
  "الجوف": "Al Jouf"
};

// Reverse mapping for displaying stored English values in Arabic
const reverseRegionMapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(regionMapping).map(([ar, en]) => [en, ar])
);

const RestaurantSetup = () => {
  const { user, loading, checkUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    category: '' as RestaurantCategory,
    vision: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Get current regions based on language
  const currentRegions = regions[language] || regions.en;

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
        // Display location in current language
        const displayLocation = language === 'ar' && reverseRegionMapping[data.location] 
          ? reverseRegionMapping[data.location] 
          : data.location;
          
        setFormData({
          name: data.name,
          location: displayLocation,
          category: data.category,
          vision: data.vision || ''
        });
        setIsEditing(true);
        setRestaurantId(data.id);
      }
    } catch (error: any) {
      toast({
        title: t('restaurant.error'),
        description: t('restaurant.failedToLoad'),
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert location to English for database storage
      const locationForDb = regionMapping[formData.location] || formData.location;
      
      if (isEditing && restaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: formData.name,
            location: locationForDb,
            category: formData.category,
            vision: formData.vision || null
          })
          .eq('id', restaurantId);

        if (error) throw error;

        toast({
          title: t('restaurant.success'),
          description: t('restaurant.profileUpdated')
        });
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user?.id,
            name: formData.name,
            location: locationForDb,
            category: formData.category,
            vision: formData.vision || null
          });

        if (error) throw error;

        toast({
          title: t('restaurant.success'),
          description: t('restaurant.profileCreated')
        });
      }

      // Update the auth context to reflect the new restaurant
      await checkUserProfile();
      
      // Navigate to user dashboard
      navigate('/user-dashboard');
    } catch (error: any) {
      toast({
        title: t('restaurant.error'),
        description: error.message || t('restaurant.failedToSave'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-4 px-4 sm:py-8 sm:px-6 lg:py-12">
      <div className="container mx-auto max-w-lg sm:max-w-xl lg:max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-deep-blue dark:text-white leading-tight">
              {isEditing ? t('restaurant.updateProfile') : t('restaurant.completeProfile')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {isEditing 
                ? t('restaurant.updateInformation')
                : t('restaurant.tellUsAbout')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t('restaurant.name')} *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('restaurant.enterName')}
                  required
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">{t('restaurant.location')}</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(value: string) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder={t('restaurant.locationPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    {currentRegions.map((region) => (
                      <SelectItem 
                        key={region} 
                        value={region}
                        className="text-base py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">{t('restaurant.category')} *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: RestaurantCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder={t('restaurant.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    {restaurantCategories.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="text-base py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision" className="text-sm font-medium">{t('restaurant.vision')}</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder={t('restaurant.visionPlaceholder')}
                  rows={4}
                  className="resize-none text-base min-h-[100px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:flex-1 h-11 text-base"
                  >
                    {t('restaurant.cancel')}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 h-11 text-base bg-gradient-primary hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? t('restaurant.updating') : t('restaurant.creating')}
                    </>
                  ) : (
                    isEditing ? t('restaurant.updateButton') : t('restaurant.completeSetup')
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
