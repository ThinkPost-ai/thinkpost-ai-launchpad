
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ProductForm from './ProductForm';
import ProductImageUpload from './ProductImageUpload';

interface Product {
  name: string;
  price: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
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
  return (
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
      <CardContent className="space-y-4">
        <ProductForm
          index={index}
          product={product}
          onUpdateProduct={onUpdateProduct}
        />
        <ProductImageUpload
          index={index}
          imagePreview={product.imagePreview}
          onImageSelect={onImageSelect}
          onRemoveImage={onRemoveImage}
        />
      </CardContent>
    </Card>
  );
};

export default ProductCard;
