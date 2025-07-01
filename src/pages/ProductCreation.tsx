import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, CheckCircle, Instagram } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductCreationActions from '@/components/product/ProductCreationActions';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TikTokIcon from '@/components/ui/TikTokIcon';

const ProductCreation = () => {
  const navigate = useNavigate();
  const { tiktokProfile, isLoading: tiktokLoading } = useTikTokConnection();
  const { instagramProfile, isLoading: instagramLoading } = useInstagramConnection();
  const { session } = useAuth();
  
  const {
    products,
    saving,
    generatingCaptions,
    addProduct,
    removeProduct,
    updateProduct,
    handleImageSelect,
    removeImage,
    validateProducts,
    saveProductsOnly,
    saveProductsWithCaptions
  } = useProductManagement();

  // TikTok display name state
  const [tiktokDisplayName, setTikTokDisplayName] = useState<string | null>(null);
  const [loadingDisplayName, setLoadingDisplayName] = useState(false);

  // Fetch TikTok display name when connected
  useEffect(() => {
    const fetchTikTokDisplayName = async () => {
      if (!tiktokProfile?.tiktok_connected || !session?.access_token) return;
      
      setLoadingDisplayName(true);
      try {
        const { data, error } = await supabase.functions.invoke('tiktok-creator-info', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error fetching TikTok creator info:', error);
          return;
        }

        if (data.success && data.creatorInfo) {
          setTikTokDisplayName(data.creatorInfo.display_name);
        }
      } catch (error) {
        console.error('Error fetching TikTok display name:', error);
      } finally {
        setLoadingDisplayName(false);
      }
    };

    fetchTikTokDisplayName();
  }, [tiktokProfile?.tiktok_connected, session?.access_token]);

  const isFormValid = validateProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            Add Products
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add your delicious dishes with details and images to generate AI-powered captions
          </p>
        </div>

        {/* Platform Connection Status */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Platform Connection Status</CardTitle>
            <CardDescription>Current platform connections for posting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TikTok Connection Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={tiktokProfile?.tiktok_avatar_url || ''} />
                  <AvatarFallback className={`${tiktokProfile?.tiktok_connected ? 'bg-green-600' : 'bg-gray-400'}`}>
                    <TikTokIcon className="h-5 w-5 text-white" size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">TikTok</span>
                    {tiktokProfile?.tiktok_connected ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tiktokProfile?.tiktok_connected ? (
                      <span>
                        <span className="font-medium">TikTok Name:</span>{' '}
                        {loadingDisplayName ? (
                          'Loading...'
                        ) : (
                          tiktokDisplayName || tiktokProfile.tiktok_username || 'TikTok User'
                        )}
                      </span>
                    ) : (
                      'Not connected'
                    )}
                  </p>
                </div>
              </div>

              {/* Instagram Connection Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-lg ${instagramProfile?.connected ? 'bg-green-600' : 'bg-gray-400'}`}>
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Instagram</span>
                    {instagramProfile?.connected ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {instagramProfile?.connected 
                      ? `Connected as @${instagramProfile.username || 'Instagram User'}`
                      : 'Not connected'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {products.map((product, index) => (
            <ProductCard
              key={index}
              index={index}
              product={product}
              canRemove={products.length > 1}
              onUpdateProduct={updateProduct}
              onRemoveProduct={removeProduct}
              onImageSelect={handleImageSelect}
              onRemoveImage={removeImage}
            />
          ))}

          <ProductCreationActions
            onAddProduct={addProduct}
            onSaveProductsOnly={saveProductsOnly}
            onSaveProductsWithCaptions={saveProductsWithCaptions}
            saving={saving}
            generatingCaptions={generatingCaptions}
            isFormValid={isFormValid}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCreation;
