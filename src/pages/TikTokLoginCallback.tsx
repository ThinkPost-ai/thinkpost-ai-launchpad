
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const TikTokLoginCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Feature Unavailable",
      description: "TikTok connection has been disabled.",
      variant: "destructive"
    });
    navigate('/user-dashboard?tab=overview');
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
          TikTok Connection Disabled
        </h2>
        <p className="text-muted-foreground">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default TikTokLoginCallback;
