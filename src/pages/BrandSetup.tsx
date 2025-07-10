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
import { Loader2, Sun, Moon, Languages, Info, AlertTriangle } from 'lucide-react';
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
  const { user, loading, checkUserProfile, signOut } = useAuth();
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
    otherLocation: '',
    customBrandType: '',
    customCategory: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Get current cities based on language
  const currentCities = saudiCities[language] || saudiCities.en;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (user) {
      checkUserAuth();
    }
  }, [user, loading, navigate]);

  const checkUserAuth = async () => {
    try {
      // Verify that the user exists in the auth system
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        setAuthError('Your session has expired or is invalid. Please sign in again.');
        return;
      }

      // Check if user ID matches
      if (authUser.user.id !== user?.id) {
        setAuthError('Session mismatch detected. Please sign in again.');
        return;
      }

      // Clear any previous auth errors
      setAuthError(null);
      
      // Proceed with checking existing brand
      checkExistingBrand();
    } catch (error: any) {
      console.error('Error checking user authentication:', error);
      setAuthError('Authentication verification failed. Please sign in again.');
    }
  };

  const handleAuthError = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation even if sign out fails
      navigate('/');
    }
  };

  const checkExistingBrand = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('Found existing restaurant:', data);
        
        // Handle location display - check if it's already in Arabic or needs mapping
        let displayLocation = data.location;
        if (language === 'ar') {
          // If we're in Arabic mode, check if the stored location is English and needs mapping
          if (reverseCityMapping[data.location]) {
            displayLocation = reverseCityMapping[data.location];
          }
          // If it's already in Arabic, use it as is
        } else {
          // If we're in English mode, check if the stored location is Arabic and needs mapping
          if (cityMapping[data.location]) {
            displayLocation = cityMapping[data.location];
          }
          // If it's already in English, use it as is
        }

        // Build locations array from primary location and additional locations
        const locations = [displayLocation];
        if (data.additional_locations) {
          // Handle additional locations - map them to current language
          const mappedAdditionalLocations = data.additional_locations.map(loc => {
            if (language === 'ar') {
              // If we're in Arabic mode, check if the stored location is English and needs mapping
              return reverseCityMapping[loc] || loc;
            } else {
              // If we're in English mode, check if the stored location is Arabic and needs mapping
              return cityMapping[loc] || loc;
            }
          });
          locations.push(...mappedAdditionalLocations);
        }

        // Determine brand type from stored brand_type or fallback to category
        const brandType = data.brand_type || getBrandTypeFromCategory(data.category);
        
        console.log('Setting form data with:', {
          name: data.name,
          locations: locations,
          brandType: brandType,
          category: brandType === 'restaurant' ? data.category : '' as RestaurantCategory,
          vision: data.vision || '',
          otherLocation: data.custom_location || '',
          customBrandType: data.custom_brand_type || '',
          customCategory: data.custom_category || ''
        });
        
        setFormData({
          name: data.name,
          locations: locations,
          brandType: brandType,
          category: brandType === 'restaurant' ? data.category : '' as RestaurantCategory,
          vision: data.vision || '',
          otherLocation: data.custom_location || '',
          customBrandType: data.custom_brand_type || '',
          customCategory: data.custom_category || ''
        });
        setIsEditing(true);
        setBrandId(data.id);
        
        console.log('Set editing mode:', { isEditing: true, brandId: data.id });
      } else {
        console.log('No existing restaurant found');
      }
    } catch (error: any) {
      console.error('Error in checkExistingBrand:', error);
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
      // Double-check authentication before submitting
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (authUser.user.id !== user?.id) {
        throw new Error('Session mismatch detected. Please sign in again.');
      }

      // Convert locations to English for database storage and handle "Other"
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

      // Determine final category for database
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
      
      if (isEditing && brandId) {
        const { error } = await supabase
          .from('restaurants')
          .update(updateData)
          .eq('id', brandId);

        if (error) {
          if (error.message.includes('foreign key constraint')) {
            throw new Error('Your session has expired. Please sign in again.');
          }
          throw error;
        }

        toast({
          title: "Success",
          description: "Brand profile updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('restaurants')
          .insert({
            owner_id: authUser.user.id,
            ...updateData
          });

        if (error) {
          if (error.message.includes('foreign key constraint')) {
            throw new Error('Your session has expired. Please sign in again.');
          }
          throw error;
        }

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
      console.error('Brand setup error:', error);
      
      if (error.message.includes('session has expired') || error.message.includes('sign in again')) {
        setAuthError(error.message);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save brand information",
          variant: "destructive"
        });
      }
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

  // Show authentication error screen
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl font-bold text-deep-blue dark:text-white">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-center">
              {authError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleAuthError}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Sign In Again
            </Button>
          </CardContent>
        </Card>
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

              {/* Custom Brand Type Input (shown when "Other" is selected) */}
              {formData.brandType === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="customBrandType" className="text-sm font-medium">Please write your Brand type *</Label>
                  <Input
                    id="customBrandType"
                    type="text"
                    value={formData.customBrandType}
                    onChange={(e) => setFormData({ ...formData, customBrandType: e.target.value })}
                    placeholder="Enter your brand type"
                    required
                    className="h-11 text-base"
                  />
                </div>
              )}

              {/* Restaurant Category (shown only when Brand Type is "restaurant") */}
              {formData.brandType === 'restaurant' && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Select category" />
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
                  <Label htmlFor="customCategory" className="text-sm font-medium">Please write your restaurant category *</Label>
                  <Input
                    id="customCategory"
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="Enter your restaurant category"
                    required
                    className="h-11 text-base"
                  />
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