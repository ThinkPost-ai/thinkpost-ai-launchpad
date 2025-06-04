
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Image, MessageSquare, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStats {
  totalPosts: number;
  upcomingPosts: number;
  captionCredits: number;
  captionQuotaTotal: number;
  totalImages: number;
}

interface OverviewCardsProps {
  stats: DashboardStats;
}

const OverviewCards = ({ stats }: OverviewCardsProps) => {
  const { t } = useLanguage();
  const quotaPercentage = ((stats.captionQuotaTotal - stats.captionCredits) / stats.captionQuotaTotal) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalPosts')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.totalPosts}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.overview.totalPostsSubtext')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.overview.upcomingPosts')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.upcomingPosts}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.overview.upcomingPostsSubtext')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.overview.captionCredits')}</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.captionCredits}/{stats.captionQuotaTotal}
          </div>
          <Progress value={100 - quotaPercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.overview.captionCreditsSubtext', { credits: stats.captionCredits })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.overview.mediaLibrary')}</CardTitle>
          <Image className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.totalImages}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.overview.mediaLibrarySubtext')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewCards;
