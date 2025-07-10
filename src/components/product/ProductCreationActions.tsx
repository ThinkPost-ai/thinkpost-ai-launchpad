import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, isRTL } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        onClick={onAddProduct}
        className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t('productActions.addAnother')}
      </Button>

      <div className="flex gap-4">
        <Button
          onClick={onSaveProductsOnly}
          disabled={saving || generatingCaptions || !isFormValid}
          variant="outline"
          className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {saving ? (
            <>
              <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('productActions.saving')}
            </>
          ) : (
            t('productActions.save')
          )}
        </Button>
        <Button
          onClick={onSaveProductsWithCaptions}
          disabled={saving || generatingCaptions || !isFormValid}
          className={`bg-gradient-primary hover:opacity-90 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {generatingCaptions ? (
            <>
              <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('productActions.uploadingGenerating')}
            </>
          ) : (
            t('productActions.saveAndGenerate')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCreationActions;
