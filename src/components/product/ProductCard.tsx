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
}

interface ProductCardProps {
  index: number;
  product: Product;
  canRemove: boolean;
  onUpdateProduct: (index: number, field: keyof Product, value: any) => void;
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
  onRemoveProduct,
  onImageSelect,
  onRemoveImage,
  onTikTokValidationChange
}: ProductCardProps) => {
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();
  
  const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
  const isInstagramConnected = instagramProfile?.connected || false;
  
  // Check if user has enabled any platforms
  const hasEnabledPlatforms = (product.tiktokEnabled && isTikTokConnected) || 
                              (product.instagramEnabled && isInstagramConnected);

  const [tiktokSettings, setTiktokSettings] = useState({
    privacyLevel: 'public' as 'public' | 'friends' | 'only_me',
    allowComments: true,
    commercialContent: false,
    yourBrand: false,
    brandedContent: false
  });

  // State for TikTok advanced settings expansion
  const [tiktokAdvancedExpanded, setTiktokAdvancedExpanded] = useState(false);

  // Helper function to check if "only me" should be disabled
  const isOnlyMeDisabled = () => {
    return tiktokSettings.commercialContent && tiktokSettings.brandedContent;
  };

  // Helper function to get compliance message
  const getComplianceMessage = () => {
    if (!tiktokSettings.commercialContent) {
      return {
        text: "By posting, you agree to TikTok's Music Usage Confirmation.",
        links: [
          { text: "Music Usage Confirmation", url: "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" }
        ]
      };
    }

    const hasYourBrand = tiktokSettings.yourBrand;
    const hasBrandedContent = tiktokSettings.brandedContent;

    if (hasYourBrand && hasBrandedContent) {
      return {
        text: "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.",
        links: [
          { text: "Branded Content Policy", url: "https://www.tiktok.com/legal/page/global/bc-policy/en" },
          { text: "Music Usage Confirmation", url: "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" }
        ]
      };
    }

    if (hasBrandedContent) {
      return {
        text: "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.",
        links: [
          { text: "Branded Content Policy", url: "https://www.tiktok.com/legal/page/global/bc-policy/en" },
          { text: "Music Usage Confirmation", url: "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" }
        ]
      };
    }

    if (hasYourBrand) {
      return {
        text: "By posting, you agree to TikTok's Music Usage Confirmation.",
        links: [
          { text: "Music Usage Confirmation", url: "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" }
        ]
      };
    }

    return {
      text: "By posting, you agree to TikTok's Music Usage Confirmation.",
      links: [
        { text: "Music Usage Confirmation", url: "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" }
      ]
    };
  };

  // Handler for privacy level changes
  const handlePrivacyLevelChange = (value: string) => {
    setTiktokSettings(prev => ({ ...prev, privacyLevel: value as 'public' | 'friends' | 'only_me' }));
  };

  // Handler for branded content changes
  const handleBrandedContentChange = (checked: boolean) => {
    setTiktokSettings(prev => {
      const newSettings = { ...prev, brandedContent: checked };
      
      // If branded content is enabled and privacy is "only me", switch to public
      if (checked && prev.privacyLevel === 'only_me') {
        newSettings.privacyLevel = 'public';
      }
      
      return newSettings;
    });
  };

  // TikTok validation logic
  const isTikTokValidationValid = () => {
    if (!product.tiktokEnabled || !isTikTokConnected) {
      return true; // If TikTok is not enabled, no validation needed
    }
    
    if (!tiktokSettings.commercialContent) {
      return true; // If commercial content is not checked, validation passes
    }
    
    // If commercial content is checked, at least one sub-option must be selected
    return tiktokSettings.yourBrand || tiktokSettings.brandedContent;
  };

  // Update validation when settings change
  useEffect(() => {
    const isValid = isTikTokValidationValid();
    onTikTokValidationChange?.(index, isValid);
  }, [tiktokSettings, product.tiktokEnabled, isTikTokConnected, index, onTikTokValidationChange]);

  const showTikTokValidationWarning = product.tiktokEnabled && 
                                      isTikTokConnected && 
                                      tiktokSettings.commercialContent && 
                                      !tiktokSettings.yourBrand && 
                                      !tiktokSettings.brandedContent;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product {index + 1}</CardTitle>
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
                  📱 Social Media Apps
                </h3>
                
                <div className="space-y-4">
                  {/* TikTok Toggle */}
                  <div>
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
                                {isTikTokConnected ? 'Post to TikTok' : 'Connect TikTok account first'}
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
                          <p>Connect your TikTok account from dashboard to enable posting to this app.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>


                    {/* TikTok Advanced Settings - shown when expanded */}
                    {product.tiktokEnabled && isTikTokConnected && tiktokAdvancedExpanded && (
                      <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <TikTokIcon className="h-4 w-4" size={16} />
                            Advanced Settings
                          </h4>
                          <div className="space-y-4 text-sm">
                            {/* Privacy Level */}
                            <div>
                              <Label className="font-medium flex items-center gap-1 mb-3">
                                Privacy Level:
                              </Label>
                              <RadioGroup 
                                value={tiktokSettings.privacyLevel.toUpperCase()} 
                                onValueChange={(value) => handlePrivacyLevelChange(value.toLowerCase())}
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="PUBLIC" id={`public-${index}`} />
                                  <Label htmlFor={`public-${index}`} className="text-sm">
                                    Public
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="MUTUAL_FOLLOW_FRIEND" id={`friends-${index}`} />
                                  <Label htmlFor={`friends-${index}`} className="text-sm">
                                    Friends
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center space-x-2 ${isOnlyMeDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <RadioGroupItem 
                                          value="SELF_ONLY" 
                                          id={`only-me-${index}`}
                                          disabled={isOnlyMeDisabled()}
                                        />
                                        <Label 
                                          htmlFor={`only-me-${index}`} 
                                          className={`text-sm ${isOnlyMeDisabled() ? 'cursor-not-allowed' : ''}`}
                                        >
                                          Only me
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    {isOnlyMeDisabled() && (
                                      <TooltipContent>
                                        <p>Branded content visibility cannot be set to private.</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Interaction Settings */}
                            <div>
                              <Label className="font-medium mb-3 block">
                                Interaction Settings
                              </Label>
                              <div className="flex items-center space-x-2">
                                <Checkbox id={`allow-comments-${index}`} defaultChecked />
                                <Label htmlFor={`allow-comments-${index}`} className="text-sm">
                                  Allow Comments
                                </Label>
                              </div>
                            </div>

                            {/* Commercial Content */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`commercial-${index}`}
                                  checked={tiktokSettings.commercialContent}
                                  onCheckedChange={(checked) => 
                                    setTiktokSettings(prev => ({ 
                                      ...prev, 
                                      commercialContent: checked as boolean,
                                      // Reset sub-options when unchecked
                                      yourBrand: checked ? prev.yourBrand : false,
                                      brandedContent: checked ? prev.brandedContent : false
                                    }))
                                  }
                                />
                                <Label htmlFor={`commercial-${index}`}>
                                  This content promotes a brand, product or service
                                </Label>
                              </div>

                              {/* Conditional sub-checkboxes */}
                              {tiktokSettings.commercialContent && (
                                <div className="ml-6 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`your-brand-${index}`}
                                      checked={tiktokSettings.yourBrand}
                                      onCheckedChange={(checked) => 
                                        setTiktokSettings(prev => ({ 
                                          ...prev, 
                                          yourBrand: checked as boolean 
                                        }))
                                      }
                                    />
                                    <Label htmlFor={`your-brand-${index}`}>
                                      Your Brand
                                    </Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`branded-content-${index}`}
                                      checked={tiktokSettings.brandedContent}
                                      onCheckedChange={handleBrandedContentChange}
                                    />
                                    <Label htmlFor={`branded-content-${index}`}>
                                      Branded Content
                                    </Label>
                                  </div>
                                </div>
                              )}

                              {/* Validation warning */}
                              {showTikTokValidationWarning && (
                                <div className="ml-6 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    ⚠️ You need to indicate if your content promotes yourself, a third party, or both.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TikTok Compliance Info Line - shown when TikTok is enabled */}
                    {product.tiktokEnabled && isTikTokConnected && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {(() => {
                            const compliance = getComplianceMessage();
                            
                            // Handle different compliance message formats
                            if (compliance.links.length === 1) {
                              // Single link case
                              const link = compliance.links[0];
                              const parts = compliance.text.split(link.text);
                              return (
                                <>
                                  {parts[0]}
                                  <a 
                                    href={link.url}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {link.text}
                                  </a>
                                  {parts[1]}
                                </>
                              );
                            } else {
                              // Multiple links case
                              let result = compliance.text;
                              const elements = [];
                              let lastIndex = 0;
                              
                              compliance.links.forEach((link, index) => {
                                const linkIndex = result.indexOf(link.text, lastIndex);
                                if (linkIndex !== -1) {
                                  // Add text before link
                                  if (linkIndex > lastIndex) {
                                    elements.push(result.substring(lastIndex, linkIndex));
                                  }
                                  // Add link
                                  elements.push(
                                    <a 
                                      key={index}
                                      href={link.url}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {link.text}
                                    </a>
                                  );
                                  lastIndex = linkIndex + link.text.length;
                                }
                              });
                              
                              // Add remaining text
                              if (lastIndex < result.length) {
                                elements.push(result.substring(lastIndex));
                              }
                              
                              return elements;
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Instagram Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center justify-between p-4 border rounded-lg ${isInstagramConnected ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isInstagramConnected ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500' : 'bg-gray-400'}`}>
                            <Instagram className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <Label className="text-base font-medium">Instagram</Label>
                            <p className="text-sm text-muted-foreground">
                              {isInstagramConnected ? 'Post to Instagram' : 'Connect Instagram account first'}
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
                        <p>Connect your Instagram account from dashboard to enable posting to this app.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>

                {/* Dynamic Info note */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  {!hasEnabledPlatforms ? (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Choose which platforms to post this product to. At least one platform must be enabled.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✅ Product configured for posting to selected platforms.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ProductCard;
