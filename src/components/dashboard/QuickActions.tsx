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
        title: "Social Media Connection Required",
        description: "Please connect at least 1 social media account (TikTok or Instagram) before adding products.",
        variant: "destructive"
      });
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
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Step 1: Start & Add products */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-vibrant-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <Button 
              onClick={handleStartAddProducts}
              className="w-full h-16 bg-gradient-primary hover:opacity-90 flex flex-col gap-1 relative"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.addProducts')}</span>
            </Button>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
          
          {/* Mobile arrow */}
          <div className="lg:hidden flex items-center justify-center rotate-90">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Step 2: View captions */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <Button 
              variant="outline"
              className="w-full h-16 flex flex-col gap-1 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-950"
              onClick={onCaptionsClick}
            >
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.viewCaptions')}</span>
            </Button>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
          
          {/* Mobile arrow */}
          <div className="lg:hidden flex items-center justify-center rotate-90">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          {/* Step 3: Schedule Post */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <Button 
              variant="outline"
              className="w-full h-16 flex flex-col gap-1 border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:border-green-600 dark:hover:bg-green-950"
              onClick={onScheduleClick}
            >
              <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-xs text-center leading-tight">{t('dashboard.quickActions.schedulePost')}</span>
            </Button>
          </div>
        </div>

        {/* Flow description */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Complete workflow: Add content → Generate captions → Schedule posts
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
