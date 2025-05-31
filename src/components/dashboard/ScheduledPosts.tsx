
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock,
  Instagram,
  Play
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  image_url: string;
  caption: string;
  scheduled_date: Date;
  platform: 'instagram' | 'tiktok' | 'facebook';
  status: 'scheduled' | 'posted' | 'failed';
}

const ScheduledPosts = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Mock data for scheduled posts
  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      image_url: '/api/placeholder/200/200',
      caption: 'تذوق أشهى الأطباق في مطعمنا اليوم! 🍽️✨',
      scheduled_date: new Date(),
      platform: 'instagram',
      status: 'scheduled'
    },
    {
      id: '2',
      image_url: '/api/placeholder/200/200',
      caption: 'وجبة الغداء الخاصة متوفرة الآن! 🥘',
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      platform: 'tiktok',
      status: 'scheduled'
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'tiktok':
        return <Play className="h-4 w-4 text-black" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'default',
      posted: 'success',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-vibrant-purple" />
                Scheduled Posts
              </CardTitle>
              <CardDescription>
                Manage your scheduled social media posts
              </CardDescription>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'weekly')}>
            <TabsList className="grid w-full grid-cols-2 lg:w-auto">
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                {/* Scheduled Posts for Selected Date */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Posts for {selectedDate?.toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scheduledPosts
                        .filter(post => 
                          post.scheduled_date.toDateString() === selectedDate?.toDateString()
                        )
                        .map((post) => (
                          <div key={post.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <img
                              src={post.image_url}
                              alt="Scheduled post"
                              className="h-16 w-16 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-right mb-2" dir="rtl">
                                {post.caption}
                              </p>
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(post.platform)}
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {post.scheduled_date.toLocaleTimeString()}
                                </span>
                                {getStatusBadge(post.status)}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      
                      {scheduledPosts.filter(post => 
                        post.scheduled_date.toDateString() === selectedDate?.toDateString()
                      ).length === 0 && (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            No posts scheduled for this date
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - date.getDay() + i);
                      
                      return (
                        <div key={i} className="border rounded-lg p-4">
                          <h4 className="font-medium text-center mb-2">
                            {date.toLocaleDateString('en', { weekday: 'short' })}
                          </h4>
                          <p className="text-sm text-center text-muted-foreground mb-4">
                            {date.getDate()}
                          </p>
                          
                          {/* Posts for this day */}
                          <div className="space-y-2">
                            {scheduledPosts
                              .filter(post => post.scheduled_date.toDateString() === date.toDateString())
                              .map(post => (
                                <div key={post.id} className="p-2 bg-muted rounded text-xs">
                                  <div className="flex items-center gap-1 mb-1">
                                    {getPlatformIcon(post.platform)}
                                    <span>{post.scheduled_date.toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}</span>
                                  </div>
                                  <p className="truncate text-right" dir="rtl">
                                    {post.caption.substring(0, 30)}...
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledPosts;
