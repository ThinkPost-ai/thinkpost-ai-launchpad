import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, TrendingUp } from 'lucide-react';

interface AdminStatsData {
  totalUsers: number;
  activeUsers: number;
  totalScheduledPosts: number;
  totalProducts: number;
  recentSignups: number;
}

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalScheduledPosts: 0,
    totalProducts: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (those with TikTok or Instagram connected)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('tiktok_connected.eq.true,instagram_connected.eq.true');

      // Get total scheduled posts
      const { count: totalScheduledPosts } = await supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true });

      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalScheduledPosts: totalScheduledPosts || 0,
        totalProducts: totalProducts || 0,
        recentSignups: recentSignups || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('admin.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      description: t('admin.totalUsersDesc'),
    },
    {
      title: t('admin.activeUsers'),
      value: stats.activeUsers,
      icon: TrendingUp,
      description: t('admin.activeUsersDesc'),
    },
    {
      title: t('admin.scheduledPosts'),
      value: stats.totalScheduledPosts,
      icon: Calendar,
      description: t('admin.scheduledPostsDesc'),
    },
    {
      title: t('admin.totalProducts'),
      value: stats.totalProducts,
      icon: FileText,
      description: t('admin.totalProductsDesc'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStats;