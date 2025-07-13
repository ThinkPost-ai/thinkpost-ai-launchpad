import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onCaptionsClick: () => void;
  onScheduleClick: () => void;
}

const QuickActions = ({ onCaptionsClick, onScheduleClick }: QuickActionsProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get social media connection status
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();

  const handleStartAddProducts = () => {
    // Check if at least one social media account is connected
    const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
    const isInstagramConnected = instagramProfile?.connected || false;
    
    if (!isTikTokConnected && !isInstagramConnected) {
      toast({
        title: t('toast.socialMediaConnectionRequired'),
        description: t('toast.socialMediaConnectionRequiredDesc'),
        variant: "destructive"
      });
      
      // Scroll to the first social media connection card
      setTimeout(() => {
        const socialMediaCards = document.querySelector('[data-testid="tiktok-connection"], [data-testid="instagram-connection"]');
        if (socialMediaCards) {
          socialMediaCards.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      return;
    }

    // If at least one platform is connected, proceed to upload page
    navigate('/upload');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-vibrant-purple" />
          {t('dashboard.quickActions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full min-w-0">
          {/* Step 1: Start & Add products */}
          <div className="flex flex-col items-center gap-2 flex-1 w-full min-w-0">
            <div className="w-8 h-8 bg-vibrant-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <Button 
              onClick={handleStartAddProducts}
              className="w-full min-w-[120px] h-16 bg-gradient-primary hover:opacity-90 flex flex-col gap-1 items-center justify-center"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.addProducts')}</span>
            </Button>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex items-center justify-center min-w-[32px]">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
          
          {/* Mobile arrow */}
          <div className="lg:hidden flex items-center justify-center rotate-90 min-h-[32px]">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Step 2: View captions */}
          <div className="flex flex-col items-center gap-2 flex-1 w-full min-w-0">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <Button 
              variant="outline"
              className="w-full min-w-[120px] h-16 flex flex-col gap-1 items-center justify-center border-2 border-blue-400 bg-blue-100 text-blue-900 hover:bg-blue-200 hover:border-blue-500 dark:border-blue-500 dark:bg-blue-900/10 dark:text-blue-200 dark:hover:bg-blue-900/30 dark:hover:border-blue-400"
              onClick={onCaptionsClick}
            >
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.viewCaptions')}</span>
            </Button>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex items-center justify-center min-w-[32px]">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
          
          {/* Mobile arrow */}
          <div className="lg:hidden flex items-center justify-center rotate-90 min-h-[32px]">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Step 3: Schedule Post */}
          <div className="flex flex-col items-center gap-2 flex-1 w-full min-w-0">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <Button 
              variant="outline"
              className="w-full min-w-[120px] h-16 flex flex-col gap-1 items-center justify-center border-2 border-green-400 bg-green-100 text-green-900 hover:bg-green-200 hover:border-green-500 dark:border-green-500 dark:bg-green-900/10 dark:text-green-200 dark:hover:bg-green-900/30 dark:hover:border-green-400"
              onClick={onScheduleClick}
            >
              <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.schedulePost')}</span>
            </Button>
          </div>
        </div>

        {/* Flow description */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('dashboard.quickActions.workflowDescription')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
