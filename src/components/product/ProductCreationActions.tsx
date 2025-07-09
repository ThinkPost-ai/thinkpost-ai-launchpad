import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface ProductCreationActionsProps {
  onAddProduct: () => void;
  onSaveProductsOnly: () => void;
  onSaveProductsWithCaptions: () => void;
  saving: boolean;
  generatingCaptions: boolean;
  isFormValid: boolean;
}

const ProductCreationActions = ({
  onAddProduct,
  onSaveProductsOnly,
  onSaveProductsWithCaptions,
  saving,
  generatingCaptions,
  isFormValid
}: ProductCreationActionsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        onClick={onAddProduct}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Product
      </Button>

      <div className="flex gap-4">
        <Button
          onClick={onSaveProductsOnly}
          disabled={saving || generatingCaptions || !isFormValid}
          variant="outline"
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        <Button
          onClick={onSaveProductsWithCaptions}
          disabled={saving || generatingCaptions || !isFormValid}
          className="bg-gradient-primary hover:opacity-90 flex-1"
        >
          {generatingCaptions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading & Generating Content...
            </>
          ) : (
            'Save & Generate Captions'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCreationActions;
