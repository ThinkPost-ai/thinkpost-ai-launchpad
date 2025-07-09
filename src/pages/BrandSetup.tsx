import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MultiSelect, type Option } from '../components/ui/multi-select';
import { useToast } from '../components/ui/use-toast';
import { Loader2, Sun, Moon, Languages, Info } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

// Brand types with their categories
const brandTypes = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'other', label: 'Other' }
];

// Categories for each brand type
const brandCategories = {
  restaurant: [
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'casual_dining', label: 'Casual Dining' },
    { value: 'fine_dining', label: 'Fine Dining' },
    { value: 'middle_eastern', label: 'Middle Eastern' },
    { value: 'asian', label: 'Asian' },
    { value: 'italian', label: 'Italian' },
    { value: 'american', label: 'American' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'indian', label: 'Indian' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'other', label: 'Other' }
  ],
  coffee: [
    { value: 'cafe', label: 'Coffee Shop' },
    { value: 'other', label: 'Other' }
  ],
  bakery: [
    { value: 'bakery', label: 'Bakery' },
    { value: 'other', label: 'Other' }
  ],
  other: [
    { value: 'other', label: 'Other' }
  ]
};

// Saudi cities data
const saudiCities = {
  en: [
    "Riyadh", "Al Kharj", "Al Majmaah",

    "Jeddah", "Makkah", "Taif",

    "Madinah", "Yanbu", "Al-Ula",

    "Buraidah", "Unaizah", "Ar Rass",

    "Dammam", "Al Khobar", "Al Ahsa",

    "Abha", "Khamis Mushait", "Bisha",

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
    "أبها", "خميس مشيط", "بيشة",
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

// Map Arabic cities to English for database storage
const cityMapping: { [key: string]: string } = {
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
  "الجوف": "Al Jouf",
  "أخرى": "Other"
};

// Reverse mapping for displaying stored English values in Arabic
const reverseCityMapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(cityMapping).map(([ar, en]) => [en, ar])
);

const BrandSetup = () => {
  const { user, loading, checkUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    locations: [] as string[],
    brandType: '',
    category: '' as RestaurantCategory,
    vision: '',
    otherLocation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Get current cities based on language
  const currentCities = saudiCities[language] || saudiCities.en;

  // Get categories for current brand type
  const currentCategories = formData.brandType ? brandCategories[formData.brandType as keyof typeof brandCategories] || [] : [];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      checkExistingBrand();
    }
  }, [user, loading, navigate]);

  const checkExistingBrand = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Display location in current language
        const displayLocation = language === 'ar' && reverseCityMapping[data.location] 
          ? reverseCityMapping[data.location] 
          : data.location;
          
        setFormData({
          name: data.name,
          locations: [displayLocation],
          brandType: getBrandTypeFromCategory(data.category),
          category: data.category,
          vision: data.vision || '',
          otherLocation: ''
        });
        setIsEditing(true);
        setBrandId(data.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load brand information",
        variant: "destructive"
      });
    }
  };

  const getBrandTypeFromCategory = (category: RestaurantCategory): string => {
    if (category === 'cafe') return 'coffee';
    if (category === 'bakery') return 'bakery';
    return 'restaurant';
  };

  const handleBrandTypeChange = (brandType: string) => {
    setFormData(prev => ({
      ...prev,
      brandType,
      category: '' as RestaurantCategory
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert locations to English for database storage and handle "Other"
      let finalLocation = '';
      if (formData.locations.includes('Other') || formData.locations.includes('أخرى')) {
        if (formData.otherLocation.trim()) {
          finalLocation = formData.otherLocation.trim();
        } else {
          throw new Error('Please specify the location when selecting "Other"');
        }
      } else if (formData.locations.length > 0) {
        const firstLocation = formData.locations[0];
        finalLocation = cityMapping[firstLocation] || firstLocation;
      } else {
        throw new Error('Please select at least one location');
      }

      if (!formData.name.trim()) {
        throw new Error('Brand name is required');
      }

      if (!formData.brandType) {
        throw new Error('Brand type is required');
      }

      if (!formData.category) {
        throw new Error('Brand category is required');
      }
      
      if (isEditing && brandId) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: formData.name.trim(),
            location: finalLocation,
            category: formData.category,
            vision: formData.vision.trim() || null
          })
          .eq('id', brandId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Brand profile updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user?.id,
            name: formData.name.trim(),
            location: finalLocation,
            category: formData.category,
            vision: formData.vision.trim() || null
          });

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Brand profile created successfully"
        });
      }

      // Update the auth context to reflect the new brand
      await checkUserProfile();
      
      // Navigate to user dashboard
      navigate('/user-dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save brand information",
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
        {/* Toggle Buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleLanguage}
            className="h-9 w-9"
          >
            <Languages className="h-4 w-4" />
            <span className="sr-only">Toggle language</span>
          </Button>
        </div>

        {/* Informational Message */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Create High-Quality Content</p>
              <p>Provide detailed and accurate information about your brand to help our AI generate better, more engaging content for your social media posts.</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-deep-blue dark:text-white leading-tight">
              {isEditing ? 'Update Brand Profile' : 'Complete Brand Profile'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {isEditing 
                ? 'Update your brand information'
                : 'Tell us about your brand to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Brand Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your brand name"
                  required
                  className="h-11 text-base"
                />
              </div>

              {/* Brand Location (Multi-select) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand Location</Label>
                <MultiSelect
                  options={currentCities.map(city => ({ value: city, label: city }))}
                  selected={formData.locations}
                  onChange={(values: string[]) => setFormData(prev => ({
                    ...prev,
                    locations: values
                  }))}
                  placeholder="Select locations"
                  className="h-11 text-base"
                />
                {(formData.locations.includes('Other') || formData.locations.includes('أخرى')) && (
                  <Input
                    type="text"
                    value={formData.otherLocation}
                    onChange={(e) => setFormData({ ...formData, otherLocation: e.target.value })}
                    placeholder="Specify your location"
                    className="h-11 text-base mt-2"
                  />
                )}
              </div>

              {/* Brand Type */}
              <div className="space-y-2">
                <Label htmlFor="brandType" className="text-sm font-medium">Brand Type *</Label>
                <Select 
                  value={formData.brandType} 
                  onValueChange={handleBrandTypeChange}
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder="Select brand type" />
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

              {/* Brand Category (Conditional based on Brand Type) */}
              {formData.brandType && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    {formData.brandType === 'restaurant' ? 'Restaurant Category' : 
                     formData.brandType === 'coffee' ? 'Coffee Shop Category' :
                     formData.brandType === 'bakery' ? 'Bakery Category' : 'Category'} *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: RestaurantCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                      {currentCategories.map((category) => (
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

              {/* Brand Vision and Value */}
              <div className="space-y-2">
                <Label htmlFor="vision" className="text-sm font-medium">Brand Vision and Value</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Describe your brand's vision, mission, and core values. What makes your brand unique? What do you stand for?"
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
                    Cancel
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
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Brand' : 'Complete Setup'
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

export default BrandSetup; 