
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Image, MessageSquare, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  upcomingPosts: number;
  captionQuotaUsed: number;
  captionQuotaTotal: number;
  totalImages: number;
}

interface OverviewCardsProps {
  stats: DashboardStats;
}

const OverviewCards = ({ stats }: OverviewCardsProps) => {
  const quotaPercentage = (stats.captionQuotaUsed / stats.captionQuotaTotal) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.totalPosts}
          </div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Posts</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.upcomingPosts}
          </div>
          <p className="text-xs text-muted-foreground">
            Scheduled this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Caption Quota</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.captionQuotaUsed}/{stats.captionQuotaTotal}
          </div>
          <Progress value={quotaPercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(quotaPercentage)}% used this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Media Library</CardTitle>
          <Image className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-deep-blue dark:text-white">
            {stats.totalImages}
          </div>
          <p className="text-xs text-muted-foreground">
            Images uploaded
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewCards;
