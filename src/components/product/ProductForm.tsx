
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
  const { t } = useLanguage();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`name-${index}`}>
            {t('productForm.productName')} <span className="text-red-500">{t('productForm.required')}</span>
          </Label>
          <Input
            id={`name-${index}`}
            value={product.name}
            onChange={(e) => onUpdateProduct(index, 'name', e.target.value)}
            placeholder={t('productForm.productNamePlaceholder')}
            required
          />
        </div>
        <div>
          <Label htmlFor={`price-${index}`}>{t('productForm.price')}</Label>
          <Input
            id={`price-${index}`}
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => onUpdateProduct(index, 'price', e.target.value)}
            placeholder={t('productForm.pricePlaceholder')}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`description-${index}`}>{t('productForm.description')}</Label>
        <Textarea
          id={`description-${index}`}
          value={product.description}
          onChange={(e) => onUpdateProduct(index, 'description', e.target.value)}
          placeholder={t('productForm.descriptionPlaceholder')}
          rows={3}
        />
      </div>
    </>
  );
};

export default ProductForm;
