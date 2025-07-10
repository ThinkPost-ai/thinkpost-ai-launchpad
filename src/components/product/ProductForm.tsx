
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

interface ProductFormProps {
  index: number;
  product: Product;
  onUpdateProduct: (index: number, field: keyof Product, value: any) => void;
}

const ProductForm = ({ index, product, onUpdateProduct }: ProductFormProps) => {
  const { t, isRTL } = useLanguage();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`name-${index}`} className={isRTL ? 'text-right' : 'text-left'}>
            {t('productCard.productNameRequired')}
          </Label>
          <Input
            id={`name-${index}`}
            value={product.name}
            onChange={(e) => onUpdateProduct(index, 'name', e.target.value)}
            placeholder={t('productCard.productNamePlaceholder')}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={isRTL ? 'text-right' : 'text-left'}
            required
          />
        </div>
        <div>
          <Label htmlFor={`price-${index}`} className={isRTL ? 'text-right' : 'text-left'}>
            {t('productCard.price')}
          </Label>
          <Input
            id={`price-${index}`}
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => onUpdateProduct(index, 'price', e.target.value)}
            placeholder={t('productCard.pricePlaceholder')}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={isRTL ? 'text-right' : 'text-left'}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`description-${index}`} className={isRTL ? 'text-right' : 'text-left'}>
          {t('productCard.description')}
        </Label>
        <Textarea
          id={`description-${index}`}
          value={product.description}
          onChange={(e) => onUpdateProduct(index, 'description', e.target.value)}
          placeholder={t('productCard.descriptionPlaceholder')}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={isRTL ? 'text-right' : 'text-left'}
          rows={3}
        />
      </div>
    </>
  );
};

export default ProductForm;
