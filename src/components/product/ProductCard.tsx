import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Eye, MessageCircle, Copy, Scissors, DollarSign, Building, ChevronDown, ChevronUp, Info } from 'lucide-react';
import ProductForm from './ProductForm';
import ProductImageUpload from './ProductImageUpload';
import TikTokIcon from '@/components/ui/TikTokIcon';
import { Instagram } from 'lucide-react';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useState, useEffect } from 'react';

interface Product {
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  tiktokEnabled: boolean;
  instagramEnabled: boolean;
  tiktokSettings: {
    privacyLevel: 'public' | 'friends' | 'only_me';
    allowComments: boolean;
    commercialContent: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  };
}

interface ProductCardProps {
  index: number;
  product: Product;
  canRemove: boolean;
  onUpdateProduct: (index: number, field: keyof Product, value: any) => void;
  onUpdateTikTokSettings: (index: number, settings: Partial<Product['tiktokSettings']>) => void;
  onRemoveProduct: (index: number) => void;
  onImageSelect: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onTikTokValidationChange?: (index: number, isValid: boolean) => void;
}

const ProductCard = ({
  index,
  product,
  canRemove,
  onUpdateProduct,
  onUpdateTikTokSettings,
  onRemoveProduct,
  onImageSelect,
  onRemoveImage,
  onTikTokValidationChange
}: ProductCardProps) => {
  const { t } = useLanguage();
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();
  
  const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
  const isInstagramConnected = instagramProfile?.connected || false;
  
  // Check if user has enabled any platforms
  const hasEnabledPlatforms = (product.tiktokEnabled && isTikTokConnected) || 
                              (product.instagramEnabled && isInstagramConnected);

  // State for TikTok advanced settings expansion
  const [tiktokAdvancedExpanded, setTiktokAdvancedExpanded] = useState(false);

  // Helper function to check if "only me" should be disabled
  const isOnlyMeDisabled = () => {
    return product.tiktokSettings.commercialContent && product.tiktokSettings.brandedContent;
  };

  // Helper function to get compliance message with proper links
  const getComplianceMessage = () => {
    if (!product.tiktokSettings.commercialContent) {
      return null;
    }

    if (product.tiktokSettings.brandedContent && product.tiktokSettings.yourBrand) {
      // Both selected
      return (
        <span>
          {t('upload.complianceMessageBoth', {
            brandedContentPolicy: (
              <a 
                href="https://www.tiktok.com/legal/page/global/bc-policy/en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('upload.brandedContentPolicy')}
              </a>
            ),
            musicUsageConfirmation: (
              <a 
                href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('upload.musicUsageConfirmation')}
              </a>
            )
          })}
        </span>
      );
    } else if (product.tiktokSettings.brandedContent) {
      // Only branded content
      return (
        <span>
          {t('upload.complianceMessageBranded', {
            brandedContentPolicy: (
              <a 
                href="https://www.tiktok.com/legal/page/global/bc-policy/en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('upload.brandedContentPolicy')}
              </a>
            )
          })}
        </span>
      );
    } else if (product.tiktokSettings.yourBrand) {
      // Only your brand
      return (
        <span>
          {t('upload.complianceMessageBrand', {
            musicUsageConfirmation: (
              <a 
                href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('upload.musicUsageConfirmation')}
              </a>
            )
          })}
        </span>
      );
    }

    return null;
  };

  // Handler for privacy level changes
  const handlePrivacyLevelChange = (value: string) => {
    onUpdateTikTokSettings(index, { privacyLevel: value as 'public' | 'friends' | 'only_me' });
  };

  // Handler for branded content changes
  const handleBrandedContentChange = (checked: boolean) => {
    const newSettings: Partial<Product['tiktokSettings']> = { brandedContent: checked };
    
    // If branded content is enabled and privacy is "only me", switch to public
    if (checked && product.tiktokSettings.privacyLevel === 'only_me') {
      newSettings.privacyLevel = 'public';
    }
    
    onUpdateTikTokSettings(index, newSettings);
  };

  // TikTok validation logic
  const isTikTokValidationValid = () => {
    if (!product.tiktokEnabled || !isTikTokConnected) {
      return true; // If TikTok is not enabled, no validation needed
    }
    
    if (!product.tiktokSettings.commercialContent) {
      return true; // If commercial content is not checked, validation passes
    }
    
    // If commercial content is checked, at least one sub-option must be selected
    return product.tiktokSettings.yourBrand || product.tiktokSettings.brandedContent;
  };

  // Update validation when settings change
  useEffect(() => {
    const isValid = isTikTokValidationValid();
    onTikTokValidationChange?.(index, isValid);
  }, [product.tiktokSettings, product.tiktokEnabled, isTikTokConnected, index, onTikTokValidationChange]);

  const showTikTokValidationWarning = product.tiktokEnabled && 
                                      isTikTokConnected && 
                                      product.tiktokSettings.commercialContent && 
                                      !product.tiktokSettings.yourBrand && 
                                      !product.tiktokSettings.brandedContent;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('upload.productNumber', { number: index + 1 })}</CardTitle>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveProduct(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Product Info */}
          <div className="space-y-4">
            <div>
              
              {/* Image Upload */}
              <div className="mb-4">
                <ProductImageUpload
                  index={index}
                  imagePreview={product.imagePreview}
                  onImageSelect={onImageSelect}
                  onRemoveImage={onRemoveImage}
                  file={product.image}
                />
              </div>

              {/* Product Form */}
              <ProductForm
                index={index}
                product={product}
                onUpdateProduct={onUpdateProduct}
              />
            </div>
          </div>

          {/* Right Section - Social Media Apps */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-4 flex items-center gap-2">
                {t('upload.socialMediaApps')}
              </h3>
              
              <div className="space-y-4">
                {/* TikTok Toggle */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex items-center justify-between p-4 border rounded-lg ${isTikTokConnected ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isTikTokConnected ? 'bg-black' : 'bg-gray-400'}`}>
                              <TikTokIcon className="h-6 w-6 text-white" size={24} />
                            </div>
                            <div>
                              <Label className="text-base font-medium">TikTok</Label>
                              <p className="text-sm text-muted-foreground">
                                {isTikTokConnected ? t('upload.postToTikTok') : t('upload.connectTikTokFirst')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                          {product.tiktokEnabled && isTikTokConnected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log('Chevron clicked, current state:', tiktokAdvancedExpanded);
                                  setTiktokAdvancedExpanded(!tiktokAdvancedExpanded);
                                }}
                                className="p-1 h-8 w-8"
                              >
                                {tiktokAdvancedExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Switch
                              checked={product.tiktokEnabled && isTikTokConnected}
                              onCheckedChange={(checked) => {
                                if (isTikTokConnected) {
                                  onUpdateProduct(index, 'tiktokEnabled', checked);
                                }
                              }}
                              disabled={!isTikTokConnected}
                            />
                            
                          </div>
                        </div>
                      </TooltipTrigger>
                      {!isTikTokConnected && (
                        <TooltipContent>
                          <p>{t('upload.connectAccountTooltip', { platform: 'TikTok' })}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* TikTok Advanced Settings - shown when expanded */}
                  {product.tiktokEnabled && isTikTokConnected && tiktokAdvancedExpanded && (
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <TikTokIcon className="h-4 w-4" size={16} />
                          {t('upload.advancedSettings')}
                        </h4>
                        <div className="space-y-4 text-sm">
                          {/* Privacy Level */}
                          <div>
                            <Label className="font-medium flex items-center gap-1 mb-3">
                              {t('upload.privacyLevel')}
                            </Label>
                            <RadioGroup 
                              value={product.tiktokSettings.privacyLevel.toUpperCase()} 
                              onValueChange={(value) => handlePrivacyLevelChange(value.toLowerCase())}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PUBLIC" id={`public-${index}`} />
                                <Label htmlFor={`public-${index}`} className="text-sm">
                                  {t('upload.public')}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FRIENDS" id={`friends-${index}`} />
                                <Label htmlFor={`friends-${index}`} className="text-sm">
                                  {t('upload.friends')}
                                </Label>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem 
                                        value="ONLY_ME" 
                                        id={`only-me-${index}`}
                                        disabled={isOnlyMeDisabled()}
                                      />
                                      <Label 
                                        htmlFor={`only-me-${index}`} 
                                        className={`text-sm ${isOnlyMeDisabled() ? 'text-gray-400' : ''}`}
                                      >
                                        {t('upload.onlyMe')}
                                      </Label>
                                    </div>
                                  </TooltipTrigger>
                                  {isOnlyMeDisabled() && (
                                    <TooltipContent>
                                      <p>{t('upload.onlyMeDisabledTooltip')}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </RadioGroup>
                          </div>

                          {/* Interaction Settings */}
                          <div>
                            <Label className="font-medium mb-3 block">
                              {t('upload.interactionSettings')}
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`allow-comments-${index}`} 
                                checked={product.tiktokSettings.allowComments}
                                onCheckedChange={(checked) => 
                                  onUpdateTikTokSettings(index, { allowComments: checked as boolean })
                                }
                              />
                              <Label htmlFor={`allow-comments-${index}`} className="text-sm">
                                {t('upload.allowComments')}
                              </Label>
                            </div>
                          </div>

                          {/* Commercial Content */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`commercial-${index}`}
                                checked={product.tiktokSettings.commercialContent}
                                onCheckedChange={(checked) => 
                                  onUpdateTikTokSettings(index, { 
                                    commercialContent: checked as boolean,
                                    // Reset sub-options when unchecked
                                    yourBrand: checked ? product.tiktokSettings.yourBrand : false,
                                    brandedContent: checked ? product.tiktokSettings.brandedContent : false
                                  })
                                }
                              />
                              <Label htmlFor={`commercial-${index}`}>
                                {t('upload.commercialContent')}
                              </Label>
                            </div>

                            {/* Conditional sub-checkboxes */}
                            {product.tiktokSettings.commercialContent && (
                              <div className="ml-6 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`your-brand-${index}`}
                                    checked={product.tiktokSettings.yourBrand}
                                    onCheckedChange={(checked) => 
                                      onUpdateTikTokSettings(index, { yourBrand: checked as boolean })
                                    }
                                  />
                                  <Label htmlFor={`your-brand-${index}`}>
                                    {t('upload.yourBrand')}
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`branded-content-${index}`}
                                    checked={product.tiktokSettings.brandedContent}
                                    onCheckedChange={handleBrandedContentChange}
                                  />
                                  <Label htmlFor={`branded-content-${index}`}>
                                    {t('upload.brandedContent')}
                                  </Label>
                                </div>
                              </div>
                            )}

                            {/* Validation warning */}
                            {showTikTokValidationWarning && (
                              <div className="ml-6 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  {t('upload.commercialContentWarning')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compliance Message - only show when TikTok is enabled and commercial content is selected */}
                  {product.tiktokEnabled && isTikTokConnected && product.tiktokSettings.commercialContent && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {getComplianceMessage()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Instagram Section */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Instagram className="h-5 w-5 text-pink-500" />
                            <div>
                              <Label className="text-sm font-medium">Instagram</Label>
                              <p className="text-xs text-muted-foreground">
                                {isInstagramConnected ? t('upload.connected') : t('upload.notConnected')}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={product.instagramEnabled && isInstagramConnected}
                            onCheckedChange={(checked) => {
                              if (isInstagramConnected) {
                                onUpdateProduct(index, 'instagramEnabled', checked);
                              }
                            }}
                            disabled={!isInstagramConnected}
                          />
                        </div>
                      </TooltipTrigger>
                      {!isInstagramConnected && (
                        <TooltipContent>
                          <p>{t('upload.connectAccountTooltip', { platform: 'Instagram' })}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
