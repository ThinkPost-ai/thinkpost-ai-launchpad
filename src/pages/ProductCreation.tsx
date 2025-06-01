
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductCreationActions from '@/components/product/ProductCreationActions';
import { useProductManagement } from '@/hooks/useProductManagement';

const ProductCreation = () => {
  const navigate = useNavigate();
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
