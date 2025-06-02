
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`name-${index}`}>
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`name-${index}`}
            value={product.name}
            onChange={(e) => onUpdateProduct(index, 'name', e.target.value)}
            placeholder="e.g., Margherita Pizza"
            required
          />
        </div>
        <div>
          <Label htmlFor={`price-${index}`}>Price ($)</Label>
          <Input
            id={`price-${index}`}
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => onUpdateProduct(index, 'price', e.target.value)}
            placeholder="e.g., 12.99 (optional)"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`description-${index}`}>Description</Label>
        <Textarea
          id={`description-${index}`}
          value={product.description}
          onChange={(e) => onUpdateProduct(index, 'description', e.target.value)}
          placeholder="Describe your product... (optional)"
          rows={3}
        />
      </div>
    </>
  );
};

export default ProductForm;
