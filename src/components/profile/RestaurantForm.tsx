
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: RestaurantCategory;
  vision?: string;
  brand_type?: string;
  custom_brand_type?: string;
  custom_category?: string;
  additional_locations?: string[];
  custom_location?: string;
}

interface RestaurantFormProps {
  restaurant: Restaurant | null;
}

// Saudi cities data (same as Brand Setup)
const saudiCities = {
  en: [
    "Riyadh", "Al Kharj", "Al Majmaah",
    "Jeddah", "Makkah", "Taif",
    "Madinah", "Yanbu", "Al-Ula",
    "Buraidah", "Unaizah", "Ar Rass",
    "Dammam", "Al Khobar", "Al Ahsa",
    "Tabuk", "Duba", "Haql",
    "Hail", "Baqqa", "Al-Ghazalah",
    "Arar", "Rafha", "Turaif",
    "Abha", "Khamis Mushait", "Mahayel",
    "Jazan", "Sabya", "Abu Arish",
    "Najran", "Sharurah", "Habona",
    "Al Bahah", "Baljurashi", "Al Mandaq",
    "Sakaka", "Dumat Al-Jandal", "Tabarjal",
    "Other"
  ],
  ar: [ 
    "الرياض", "الخرج", "المجمعة",
    "جدة", "مكة", "الطائف",
    "المدينة المنورة", "ينبع", "العلا",
    "بريدة", "عنيزة", "الرس",
    "الدمام", "الخبر", "الأحساء",
    "تبوك", "ضباء", "حقل",
    "حائل", "بقعاء", "الغزالة",
    "عرعر", "رفحاء", "طريف",
    "أبها", "خميس مشيط", "محايل",
    "جازان", "صبياء", "أبو عريش",
    "نجران", "شرورة", "حبونا",
    "الباحة", "بلجرشي", "المندق",
    "سكاكا", "دومة الجندل", "طبرجل",
    "أخرى"
  ]
};

// Map Arabic cities to English for database storage (same as Brand Setup)
const cityMapping: { [key: string]: string } = {
  "الرياض": "Riyadh",
  "الخرج": "Al Kharj",
  "المجمعة": "Al Majmaah",
  "جدة": "Jeddah",
  "مكة": "Makkah",
  "الطائف": "Taif",
  "المدينة المنورة": "Madinah",
  "ينبع": "Yanbu",
  "العلا": "Al-Ula",
  "بريدة": "Buraidah",
  "عنيزة": "Unaizah",
  "الرس": "Ar Rass",
  "الدمام": "Dammam",
  "الخبر": "Al Khobar",
  "الأحساء": "Al Ahsa",
  "تبوك": "Tabuk",
  "ضباء": "Duba",
  "حقل": "Haql",
  "حائل": "Hail",
  "بقعاء": "Baqqa",
  "الغزالة": "Al-Ghazalah",
  "عرعر": "Arar",
  "رفحاء": "Rafha",
  "طريف": "Turaif",
  "أبها": "Abha",
  "خميس مشيط": "Khamis Mushait",
  "محايل": "Mahayel",
  "جازان": "Jazan",
  "صبياء": "Sabya",
  "أبو عريش": "Abu Arish",
  "نجران": "Najran",
  "شرورة": "Sharurah",
  "حبونا": "Habona",
  "الباحة": "Al Bahah",
  "بلجرشي": "Baljurashi",
  "المندق": "Al Mandaq",
  "سكاكا": "Sakaka",
  "دومة الجندل": "Dumat Al-Jandal",
  "طبرجل": "Tabarjal",
  "أخرى": "Other"
};

// Reverse mapping for displaying stored English values in Arabic (same as Brand Setup)
const reverseCityMapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(cityMapping).map(([ar, en]) => [en, ar])
);

const RestaurantForm = ({ restaurant }: RestaurantFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    locations: [] as string[],
    brandType: '',
    category: '' as RestaurantCategory,
    vision: '',
    otherLocation: '',
    customBrandType: '',
    customCategory: ''
  });

  // Brand types with their categories using translation keys
  const brandTypes = [
    { value: 'restaurant', label: t('brandTypes.restaurant') },
    { value: 'coffee', label: t('brandTypes.coffee') },
    { value: 'bakery', label: t('brandTypes.bakery') },
    { value: 'other', label: t('brandTypes.other') }
  ];

  // Categories for each brand type using translation keys
  const brandCategories = {
    restaurant: [
      { value: 'fast_food', label: t('categories.fastFood') },
      { value: 'casual_dining', label: t('categories.casualDining') },
      { value: 'fine_dining', label: t('categories.fineDining') },
      { value: 'middle_eastern', label: t('categories.middleEastern') },
      { value: 'asian', label: t('categories.asian') },
      { value: 'italian', label: t('categories.italian') },
      { value: 'american', label: t('categories.american') },
      { value: 'mexican', label: t('categories.mexican') },
      { value: 'indian', label: t('categories.indian') },
      { value: 'seafood', label: t('categories.seafood') },
      { value: 'pizza', label: t('categories.pizza') },
      { value: 'other', label: t('categories.other') }
    ],
    coffee: [
      { value: 'cafe', label: t('categories.coffeeShop') },
      { value: 'other', label: t('categories.other') }
    ],
    bakery: [
      { value: 'bakery', label: t('categories.bakery') },
      { value: 'other', label: t('categories.other') }
    ],
    other: [
      { value: 'other', label: t('categories.other') }
    ]
  };

  // Get current cities based on language (same as Brand Setup)
  const currentCities = saudiCities[language] || saudiCities.en;

  useEffect(() => {
    if (restaurant) {
      // Display location in current language (same logic as Brand Setup)
      const displayLocation = language === 'ar' && reverseCityMapping[restaurant.location] 
        ? reverseCityMapping[restaurant.location] 
        : restaurant.location;

      // Build locations array from primary location and additional locations
      const locations = [];
      
      // Handle custom location case
      if (restaurant.custom_location) {
        // If the primary location is a custom location, add "Other" to locations array
        if (restaurant.location === restaurant.custom_location) {
          locations.push(language === 'ar' ? 'أخرى' : 'Other');
        } else {
          // If primary location is not custom, add it normally
          locations.push(displayLocation);
        }
      } else {
        // No custom location, add primary location normally
        locations.push(displayLocation);
      }
      
      // Add additional locations
      if (restaurant.additional_locations) {
        // Map additional locations to current language
        const mappedAdditionalLocations = restaurant.additional_locations.map(loc => {
          return language === 'ar' && reverseCityMapping[loc] 
            ? reverseCityMapping[loc] 
            : loc;
        });
        locations.push(...mappedAdditionalLocations);
      }

      // Determine brand type from stored brand_type or fallback to category
      const brandType = restaurant.brand_type || getBrandTypeFromCategory(restaurant.category);
      
      setFormData({
        name: restaurant.name,
        locations: locations,
        brandType: brandType,
        category: brandType === 'restaurant' ? restaurant.category : '' as RestaurantCategory,
        vision: restaurant.vision || '',
        otherLocation: restaurant.custom_location || '',
        customBrandType: restaurant.custom_brand_type || '',
        customCategory: restaurant.custom_category || ''
      });
    }
  }, [restaurant, language]);

  const getBrandTypeFromCategory = (category: RestaurantCategory): string => {
    if (category === 'cafe') return 'coffee';
    if (category === 'bakery') return 'bakery';
    return 'restaurant';
  };

  const handleBrandTypeChange = (brandType: string) => {
    setFormData(prev => ({
      ...prev,
      brandType,
      category: '' as RestaurantCategory,
      customBrandType: '',
      customCategory: ''
    }));
  };

  const handleCategoryChange = (category: RestaurantCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      customCategory: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert locations to English for database storage and handle "Other" (same logic as Brand Setup)
      let finalLocation = '';
      let additionalLocations: string[] = [];
      let customLocation = '';
      
      if (formData.locations.includes('Other') || formData.locations.includes('أخرى')) {
        if (formData.otherLocation.trim()) {
          customLocation = formData.otherLocation.trim();
          finalLocation = customLocation;
          // Remove "Other" from locations and add remaining ones to additional_locations
          additionalLocations = formData.locations
            .filter(loc => loc !== 'Other' && loc !== 'أخرى')
            .map(loc => cityMapping[loc] || loc);
        } else {
          throw new Error('Please specify the location when selecting "Other"');
        }
      } else if (formData.locations.length > 0) {
        const firstLocation = formData.locations[0];
        finalLocation = cityMapping[firstLocation] || firstLocation;
        // Add remaining locations to additional_locations
        additionalLocations = formData.locations
          .slice(1)
          .map(loc => cityMapping[loc] || loc);
      } else {
        throw new Error('Please select at least one location');
      }

      if (!formData.name.trim()) {
        throw new Error('Brand name is required');
      }

      if (!formData.brandType) {
        throw new Error('Brand type is required');
      }

      // Validate custom brand type if "Other" is selected
      if (formData.brandType === 'other' && !formData.customBrandType.trim()) {
        throw new Error('Please specify your brand type');
      }

      // For restaurants, category is required
      if (formData.brandType === 'restaurant') {
        if (!formData.category) {
          throw new Error('Restaurant category is required');
        }
        // Validate custom category if "Other" is selected
        if (formData.category === 'other' && !formData.customCategory.trim()) {
          throw new Error('Please specify your restaurant category');
        }
      }

      // Determine final category for database (same logic as Brand Setup)
      let finalCategory: RestaurantCategory;
      if (formData.brandType === 'restaurant') {
        if (formData.category === 'other' && formData.customCategory.trim()) {
          finalCategory = 'other';
        } else {
          finalCategory = formData.category;
        }
      } else if (formData.brandType === 'coffee') {
        finalCategory = 'cafe';
      } else if (formData.brandType === 'bakery') {
        finalCategory = 'bakery';
      } else {
        finalCategory = 'other';
      }
      
      const updateData = {
        name: formData.name.trim(),
        location: finalLocation,
        category: finalCategory,
        vision: formData.vision.trim() || null,
        brand_type: formData.brandType,
        custom_brand_type: formData.brandType === 'other' ? formData.customBrandType.trim() : null,
        custom_category: formData.category === 'other' ? formData.customCategory.trim() : null,
        additional_locations: additionalLocations.length > 0 ? additionalLocations : null,
        custom_location: customLocation || null
      };

      if (restaurant) {
        // Update existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(updateData)
          .eq('id', restaurant.id);

        if (error) throw error;

        toast({
          title: t('restaurantForm.success'),
          description: t('restaurantForm.brandUpdated'),
        });
      } else {
        // Create new restaurant
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user?.id,
            ...updateData
          });

        if (error) throw error;

        toast({
          title: t('restaurantForm.success'),
          description: t('restaurantForm.brandCreated'),
        });
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: t('restaurantForm.error'),
        description: error.message || t('restaurantForm.saveFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Brand Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {t('restaurantForm.brandName')} <span className="text-red-500">{t('restaurantForm.required')}</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('restaurantForm.brandNamePlaceholder')}
          required
          className="h-11 text-base"
        />
      </div>

      {/* Brand Location (Multi-select) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('restaurantForm.brandLocation')}</Label>
        <MultiSelect
          options={currentCities.map(city => ({ value: city, label: city }))}
          selected={formData.locations}
          onChange={(values: string[]) => setFormData(prev => ({
            ...prev,
            locations: values
          }))}
          placeholder={t('restaurantForm.selectLocations')}
          className="h-11 text-base"
        />
        {(formData.locations.includes('Other') || formData.locations.includes('أخرى')) && (
          <Input
            type="text"
            value={formData.otherLocation}
            onChange={(e) => setFormData({ ...formData, otherLocation: e.target.value })}
            placeholder={t('restaurantForm.specifyLocation')}
            className="h-11 text-base mt-2"
          />
        )}
      </div>

      {/* Brand Type */}
      <div className="space-y-2">
        <Label htmlFor="brandType" className="text-sm font-medium">
          {t('restaurantForm.brandType')} <span className="text-red-500">{t('restaurantForm.required')}</span>
        </Label>
        <Select 
          value={formData.brandType} 
          onValueChange={handleBrandTypeChange}
        >
          <SelectTrigger className="h-11 text-base">
            <SelectValue placeholder={t('restaurantForm.selectBrandType')} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            {brandTypes.map((type) => (
              <SelectItem 
                key={type.value} 
                value={type.value}
                className="text-base py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Brand Type Input (shown when "Other" is selected) */}
      {formData.brandType === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="customBrandType" className="text-sm font-medium">
            {t('restaurantForm.customBrandType')} <span className="text-red-500">{t('restaurantForm.required')}</span>
          </Label>
          <Input
            id="customBrandType"
            type="text"
            value={formData.customBrandType}
            onChange={(e) => setFormData({ ...formData, customBrandType: e.target.value })}
            placeholder={t('restaurantForm.customBrandTypePlaceholder')}
            required
            className="h-11 text-base"
          />
        </div>
      )}

      {/* Restaurant Category (shown only when Brand Type is "restaurant") */}
      {formData.brandType === 'restaurant' && (
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            {t('restaurantForm.category')} <span className="text-red-500">{t('restaurantForm.required')}</span>
          </Label>
          <Select 
            value={formData.category} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="h-11 text-base">
              <SelectValue placeholder={t('restaurantForm.selectCategory')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
              {brandCategories.restaurant.map((category) => (
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
      )}

      {/* Custom Restaurant Category Input (shown when Category is "other") */}
      {formData.brandType === 'restaurant' && formData.category === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="customCategory" className="text-sm font-medium">
            {t('restaurantForm.customCategory')} <span className="text-red-500">{t('restaurantForm.required')}</span>
          </Label>
          <Input
            id="customCategory"
            type="text"
            value={formData.customCategory}
            onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
            placeholder={t('restaurantForm.customCategoryPlaceholder')}
            required
            className="h-11 text-base"
          />
        </div>
      )}

      {/* Brand Vision and Value */}
      <div className="space-y-2">
        <Label htmlFor="vision" className="text-sm font-medium">{t('restaurantForm.brandVision')}</Label>
        <Textarea
          id="vision"
          value={formData.vision}
          onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
          placeholder={t('restaurantForm.brandVisionPlaceholder')}
          rows={4}
          className="resize-none text-base min-h-[100px]"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-base bg-gradient-primary hover:opacity-90"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {restaurant ? t('restaurantForm.updating') : t('restaurantForm.creating')}
          </>
        ) : (
          restaurant ? t('restaurantForm.updateBrand') : t('restaurantForm.completeSetup')
        )}
      </Button>
    </form>
  );
};

export default RestaurantForm;
