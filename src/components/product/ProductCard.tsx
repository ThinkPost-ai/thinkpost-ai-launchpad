import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
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
}

const ProductCard = ({
  index,
  product,
  canRemove,
  onUpdateProduct,
  onRemoveProduct,
  onImageSelect,
  onRemoveImage
}: ProductCardProps) => {
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();
  
  const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
  const isInstagramConnected = instagramProfile?.connected || false;
  
  // Check if user has enabled any platforms
  const hasEnabledPlatforms = (product.tiktokEnabled && isTikTokConnected) || 
                              (product.instagramEnabled && isInstagramConnected);

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
