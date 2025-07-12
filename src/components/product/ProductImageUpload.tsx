
import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, ImageIcon, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductImageUploadProps {
  index: number;
  imagePreview: string | null;
  onImageSelect: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ProductImageUpload = ({ 
  index, 
  imagePreview, 
  onImageSelect, 
  onRemoveImage 
}: ProductImageUploadProps) => {
  const { t } = useLanguage();

  return (
    <div>
      <Label htmlFor={`image-${index}`}>
        {t('productImage.productImage')} <span className="text-red-500">{t('productForm.required')}</span>
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt={t('productImage.productPreview')}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            {/* TikTok Optimization Badge */}
            <div className="absolute bottom-2 left-2">
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {t('upload.tiktokReady')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <Label htmlFor={`image-${index}`} className="cursor-pointer">
              <span className="text-lg font-medium text-deep-blue dark:text-white">
                {t('productImage.clickToUpload')} <span className="text-red-500">{t('productForm.required')}</span>
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('upload.autoOptimizedForTikTok')}
              </p>
            </Label>
            <Input
              id={`image-${index}`}
              type="file"
              accept="image/*"
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
