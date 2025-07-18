
import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, ImageIcon, Video } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductImageUploadProps {
  index: number;
  imagePreview: string | null;
  onImageSelect: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  file?: File | null;
}

const ProductImageUpload = ({ 
  index, 
  imagePreview, 
  onImageSelect, 
  onRemoveImage,
  file 
}: ProductImageUploadProps) => {
  const { t } = useLanguage();

  const isVideo = file?.type.startsWith('video/');

  return (
    <div>
      <Label htmlFor={`media-${index}`}>
        {t('productImage.productImage')} <span className="text-red-500">{t('productForm.required')}</span>
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        {imagePreview ? (
          <div className="relative">
            {isVideo ? (
              <video
                src={imagePreview}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
            ) : (
              <img
                src={imagePreview}
                alt={t('productImage.productPreview')}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
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
    </div>
  );
};

export default ProductImageUpload;
