import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCreationActionsProps {
  onAddProduct: () => void;
  onSaveProducts: () => void;
  saving: boolean;
  isFormValid: boolean;
}

const ProductCreationActions = ({
  onAddProduct,
  onSaveProducts,
  saving,
  isFormValid
}: ProductCreationActionsProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        onClick={onAddProduct}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('productActions.addAnother')}
      </Button>

      <Button
        onClick={onSaveProducts}
        disabled={saving || !isFormValid}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('productActions.saving')}
          </>
        ) : (
          t('productActions.save')
        )}
      </Button>
    </div>
  );
};

export default ProductCreationActions;
