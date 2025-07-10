
import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, ImageIcon } from 'lucide-react';
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
  const { t, isRTL } = useLanguage();
  return (
    <div>
      <Label htmlFor={`image-${index}`} className={isRTL ? 'text-right' : 'text-left'}>
        {t('productCard.productImageRequired')}
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt={t('productCard.productPreview')}
              className="w-full h-48 object-cover rounded-lg"
            />
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
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <Label htmlFor={`image-${index}`} className="cursor-pointer">
              <span className={`text-lg font-medium text-deep-blue dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('productCard.clickToUpload')} <span className="text-red-500">*</span>
              </span>
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
