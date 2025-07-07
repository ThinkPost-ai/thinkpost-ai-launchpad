import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Eye, MessageCircle, Copy, Scissors, DollarSign, Building } from 'lucide-react';
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
                      </TooltipTrigger>
                      {!isTikTokConnected && (
                        <TooltipContent>
                          <p>Connect your TikTok account from dashboard to enable posting to this app.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* TikTok Compliance Declaration - directly under TikTok card */}
                    {product.tiktokEnabled && isTikTokConnected && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Compliance Declaration</h4>
                        <p className="text-sm text-muted-foreground">
                          By posting, you agree to TikTok's{' '}
                          <a 
                            href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Music Usage Confirmation
                          </a>
                        </p>
                      </div>
                    )}

                    {/* TikTok Posting Settings Accordion - directly under TikTok card */}
                    {product.tiktokEnabled && isTikTokConnected && (
                      <div className="mt-2">
                        <Accordion type="single" collapsible className="border rounded-lg">
                          <AccordionItem value="posting-settings" className="border-0">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <TikTokIcon className="h-4 w-4" size={16} />
                                <span className="text-sm font-medium">Posting Settings</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4 text-sm">
                                {/* Privacy Level */}
                                <div>
                                  <Label className="font-medium flex items-center gap-1 mb-3">
                                    Privacy Level:
                                  </Label>
                                  <RadioGroup defaultValue="PUBLIC" className="space-y-2">
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
                                      <RadioGroupItem value="SELF_ONLY" id={`only-me-${index}`} />
                                      <Label htmlFor={`only-me-${index}`} className="text-sm">
                                        Only me
                                      </Label>
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
                                          onCheckedChange={(checked) => 
                                            setTiktokSettings(prev => ({ 
                                              ...prev, 
                                              brandedContent: checked as boolean 
                                            }))
                                          }
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
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
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
