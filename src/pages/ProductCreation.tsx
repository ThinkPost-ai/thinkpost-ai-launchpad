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
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import TikTokIcon from '@/components/ui/TikTokIcon';

const ProductCreation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { tiktokProfile, isLoading: tiktokLoading } = useTikTokConnection();
  const { profile: instagramProfile, isLoading: instagramLoading } = useInstagramConnection();
  const { session } = useAuth();
  
  const {
    products,
    saving,
    generatingCaptions,
    addProduct,
    removeProduct,
    updateProduct,
    updateTikTokSettings,
    handleImageSelect,
    removeImage,
    validateProducts,
    handleTikTokValidationChange,
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
            {t('upload.backToDashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            {t('upload.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('upload.description')}
          </p>
        </div>

        {/* Platform Connection Status */}
        {/* Card for platform connection status removed as per request */}

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
              onTikTokValidationChange={handleTikTokValidationChange}
              onUpdateTikTokSettings={updateTikTokSettings}
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
