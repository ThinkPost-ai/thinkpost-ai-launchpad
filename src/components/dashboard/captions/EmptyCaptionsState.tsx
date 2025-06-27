
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const EmptyCaptionsState = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12">
      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-2">
        {t('captions.noContent')}
      </h3>
      <p className="text-muted-foreground mb-4">
        {t('captions.addProducts')}
      </p>
      <Button 
        onClick={() => window.location.href = '/upload'}
        className="bg-gradient-primary hover:opacity-90"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('captions.addFirst')}
      </Button>
    </div>
  );
};

export default EmptyCaptionsState;
