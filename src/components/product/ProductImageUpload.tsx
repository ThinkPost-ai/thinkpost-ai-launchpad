
import React, { useCallback, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ImageIcon, Video, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageVersionSelector } from './ImageVersionSelector';

interface ProductImageUploadProps {
  index: number;
  imagePreview: string | null;
  onImageSelect: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  file?: File | null;
  productId?: string; // Product ID to check for enhanced images
  enhanceImage?: boolean; // Whether enhancement is enabled
}

const ProductImageUpload = ({ 
  index, 
  imagePreview, 
  onImageSelect, 
  onRemoveImage,
  file,
  productId,
  enhanceImage = false
}: ProductImageUploadProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [enhancedImagePath, setEnhancedImagePath] = useState<string | null>(null);
  const [enhancementStatus, setEnhancementStatus] = useState<'none' | 'processing' | 'completed' | 'failed'>('none');
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'enhanced'>('original');
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);

  const isVideo = file?.type.startsWith('video/');

  // Function to get the appropriate image URL
  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  // Function to determine which image to display (enhanced or original)
  const getDisplayImage = () => {
    if (selectedVersion === 'enhanced' && enhancedImagePath && enhancementStatus === 'completed') {
      return getImageUrl(enhancedImagePath);
    }
    return imagePreview;
  };

  // Check for enhanced image when productId is available
  useEffect(() => {
    if (productId && user) {
      checkEnhancedImage();
    }
  }, [productId, user]);

  // Poll for enhancement status when processing
  useEffect(() => {
    if (enhancementStatus === 'processing' && productId) {
      const pollInterval = setInterval(() => {
        checkEnhancedImage();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [enhancementStatus, productId]);

  const checkEnhancedImage = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('enhanced_image_path, image_enhancement_status, image_path')
        .eq('id', productId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error checking enhanced image:', error);
        return;
      }

      if (data) {
        const status = (data as any).image_enhancement_status || 'none';
        const enhancedPath = (data as any).enhanced_image_path;
        const imagePath = (data as any).image_path;
        
        setEnhancementStatus(status);
        setEnhancedImagePath(enhancedPath);
        setOriginalImagePath(imagePath);
        
        // Handle compression when temp_ready
        if (status === 'temp_ready' && enhancedPath) {
          handleImageCompression(enhancedPath);
        }
      }
    } catch (error) {
      console.error('Failed to check enhanced image:', error);
    }
  };

  const handleImageCompression = async (enhancedPath: string) => {
    try {
      const { compressImage: compress } = await import('@/utils/imageCompression');
      const { downloadImageAsBlob } = await import('@/utils/imageCompression');
      
      const imageUrl = getImageUrl(enhancedPath);
      const imageBlob = await downloadImageAsBlob(imageUrl);
      const compressionResult = await compress(imageBlob, 1024 * 1024);
      
      const compressedFileName = `enhanced-${productId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(compressedFileName, compressionResult.blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (!uploadError) {
        await supabase
          .from('products')
          .update({
            enhanced_image_path: compressedFileName,
            image_enhancement_status: 'completed'
          })
          .eq('id', productId);
          
        setEnhancementStatus('completed');
        setEnhancedImagePath(compressedFileName);
        
        // Clean up temp file
        if (enhancedPath.includes('enhanced-temp-')) {
          await supabase.storage
            .from('restaurant-images')
            .remove([enhancedPath]);
        }
      }
    } catch (error) {
      console.error('Compression failed:', error);
      setEnhancementStatus('failed');
    }
  };

  // Check for enhancement when enhance toggle is enabled
  useEffect(() => {
    if (enhanceImage && productId && enhancementStatus === 'none') {
      // Check if enhancement is already marked for processing in localStorage
      const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
      if (enhancingProducts.includes(productId)) {
        setEnhancementStatus('processing');
      }
    }
  }, [enhanceImage, productId, enhancementStatus]);


  // Show loading state when enhance is enabled but enhancement hasn't started
  const shouldShowEnhancementLoading = enhanceImage && productId && enhancementStatus === 'none';
  const shouldShowProcessingLoading = enhancementStatus === 'processing';

  const displayImage = getDisplayImage();
  const isEnhanced = enhancedImagePath && enhancementStatus === 'completed';
  const isProcessing = enhancementStatus === 'processing' || shouldShowEnhancementLoading;
  const hasFailed = enhancementStatus === 'failed';

  return (
    <div>
      <Label htmlFor={`media-${index}`}>
        {t('productImage.productImage')} <span className="text-red-500">{t('productForm.required')}</span>
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        {displayImage && originalImagePath ? (
          <ImageVersionSelector
            originalImagePath={originalImagePath}
            enhancedImagePath={enhancedImagePath}
            enhancementStatus={enhancementStatus}
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
          />
        ) : displayImage ? (
          <div className="relative">
            {isVideo ? (
              <video
                src={displayImage}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
            ) : (
              <img
                src={displayImage}
                alt={t('productImage.productPreview')}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            {/* Enhancement status overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    {shouldShowEnhancementLoading ? 'Preparing enhancement...' : 'Enhancing...'}
                  </span>
                </div>
              </div>
            )}

            {/* Enhancement status badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isEnhanced && (
                <Badge className="bg-yellow-500 text-white text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Enhanced
                </Badge>
              )}
              {isProcessing && (
                <Badge className="bg-blue-500 text-white text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {shouldShowEnhancementLoading ? 'Preparing...' : 'Processing'}
                </Badge>
              )}
              {hasFailed && (
                <Badge className="bg-red-500 text-white text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Enhancement Failed
                </Badge>
              )}
            </div>

            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400 mr-2" />
              <Video className="h-8 w-8 text-gray-400" />
            </div>
            <Label htmlFor={`media-${index}`} className="cursor-pointer">
              <span className="text-lg font-medium text-deep-blue dark:text-white">
                {t('productImage.clickToUpload')} <span className="text-red-500">{t('productForm.required')}</span>
              </span>
            </Label>
            <Input
              id={`media-${index}`}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => onImageSelect(index, e)}
              className="hidden"
              required
            />
          </div>
        )}
      </div>
      
      {/* Enhancement info */}
      {isEnhanced && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Using enhanced version for posting
        </p>
      )}
    </div>
  );
};

export default ProductImageUpload;
