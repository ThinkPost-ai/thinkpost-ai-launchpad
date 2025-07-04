import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock,
  Instagram,
  Play,
  Facebook,
  Loader2,
  Trash2,
  Edit,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DayContentProps } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TikTokCompliancePostForm from './TikTokCompliancePostForm';
import TikTokIcon from '@/components/ui/TikTokIcon';

interface ScheduledPost {
  id: string;
  product_id?: string;
  image_id?: string;
  caption: string;
  scheduled_date: string;
  platform: 'instagram' | 'tiktok' | 'facebook';
  status: 'scheduled' | 'posted' | 'failed';
  image_path?: string;
  product_name?: string;
}

interface MediaItem {
  id: string;
  file_path: string;
  caption?: string;
  type: 'product' | 'image';
  name?: string;
}

const ScheduledPosts = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [cancellingAll, setCancellingAll] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [postingNow, setPostingNow] = useState<string | null>(null);
  
  // New state for TikTok compliance form
  const [showTikTokComplianceForm, setShowTikTokComplianceForm] = useState(false);
  const [selectedPostForCompliance, setSelectedPostForCompliance] = useState<ScheduledPost | null>(null);

  useEffect(() => {
    if (user) {
      fetchScheduledPosts();
    }
  }, [user]);

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          products(name, image_path),
          images(file_path)
        `)
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const transformedPosts = data.map(post => ({
        id: post.id,
        product_id: post.product_id,
        image_id: post.image_id,
        caption: post.caption,
        scheduled_date: post.scheduled_date,
        platform: post.platform as 'instagram' | 'tiktok' | 'facebook',
        status: post.status as 'scheduled' | 'posted' | 'failed',
        image_path: post.products?.image_path || post.images?.file_path,
        product_name: post.products?.name
      }));

      setScheduledPosts(transformedPosts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load scheduled posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaItems = async (): Promise<MediaItem[]> => {
    // Fetch products with captions
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_path, caption')
      .eq('user_id', user?.id)
      .not('caption', 'is', null);

    if (productsError) throw productsError;

    // Fetch images with captions
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, file_path, caption, original_filename')
      .eq('user_id', user?.id)
      .not('caption', 'is', null);

    if (imagesError) throw imagesError;

    const mediaItems: MediaItem[] = [
      ...(products || []).map(p => ({
        id: p.id,
        file_path: p.image_path,
        caption: p.caption,
        type: 'product' as const,
        name: p.name
      })),
      ...(images || []).map(i => ({
        id: i.id,
        file_path: i.file_path,
        caption: i.caption,
        type: 'image' as const,
        name: i.original_filename
      }))
    ];

    return mediaItems.filter(item => item.caption && item.file_path);
  };

  const generateSchedule = () => {
    const schedule: Date[] = [];
    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0); // Set to noon
    
    // Generate 20 posts over 4 weeks (28 days) - one post per day, skipping some days
    const totalDays = 28;
    const postsNeeded = 20;
    
    // Calculate which days to skip to get 20 posts in 28 days
    const daysToUse = Array.from({ length: totalDays }, (_, i) => i)
      .filter((_, index) => {
        // Distribute posts evenly, skipping some days
        const interval = totalDays / postsNeeded;
        return index % Math.ceil(interval) === 0;
      })
      .slice(0, postsNeeded);

    daysToUse.forEach(dayOffset => {
      const postDate = new Date(startDate);
      postDate.setDate(startDate.getDate() + dayOffset);
      schedule.push(postDate);
    });

    return schedule;
  };

  const scheduleAutomaticPosts = async () => {
    setScheduling(true);

    try {
      const mediaItems = await fetchMediaItems();

      if (mediaItems.length === 0) {
        toast({
          title: "No Content Available",
          description: "You need products or images with captions to schedule posts",
          variant: "destructive"
        });
        return;
      }

      const schedule = generateSchedule();

      const postsToCreate = schedule.map((date, index) => {
        const mediaItem = mediaItems[index % mediaItems.length];

        return {
          user_id: user!.id,
          product_id: mediaItem.type === 'product' ? mediaItem.id : null,
          image_id: mediaItem.type === 'image' ? mediaItem.id : null,
          caption: mediaItem.caption!,
          scheduled_date: date.toISOString(),
          platform: 'tiktok',
          status: 'scheduled' as const
        };
      });

      const { error } = await supabase
        .from('scheduled_posts')
        .insert(postsToCreate);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${schedule.length} TikTok posts have been scheduled over the next 4 weeks`,
      });

      await fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule posts",
        variant: "destructive"
      });
    } finally {
      setScheduling(false);
    }
  };

  const cancelAllScheduledPosts = async () => {
    setCancellingAll(true);

    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('user_id', user?.id)
        .eq('status', 'scheduled');

      if (error) throw error;

      toast({
        title: "Success!",
        description: "All scheduled posts have been deleted",
      });

      await fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete scheduled posts",
        variant: "destructive"
      });
    } finally {
      setCancellingAll(false);
    }
  };

  const startTikTokComplianceFlow = (post: ScheduledPost) => {
    setSelectedPostForCompliance(post);
    setShowTikTokComplianceForm(true);
  };

  const handleTikTokPostSuccess = async () => {
    setShowTikTokComplianceForm(false);
    setSelectedPostForCompliance(null);
    await fetchScheduledPosts();
  };

  const handleTikTokComplianceCancel = () => {
    setShowTikTokComplianceForm(false);
    setSelectedPostForCompliance(null);
  };

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'tiktok':
        return <TikTokIcon className="h-4 w-4 text-black" size={16} />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'default',
      posted: 'outline',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "The scheduled post has been deleted",
      });

      await fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const startEditDate = (post: ScheduledPost) => {
    setEditingPost(post.id);
    const postDate = new Date(post.scheduled_date);
    setNewScheduleDate(postDate);
    setSelectedHour(postDate.getHours().toString().padStart(2, '0'));
    setSelectedMinute(postDate.getMinutes().toString().padStart(2, '0'));
    setEditDialogOpen(true);
  };

  const updatePostDate = async () => {
    if (!editingPost || !newScheduleDate) return;

    // Create the final date with selected time
    const finalDate = new Date(newScheduleDate);
    finalDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          scheduled_date: finalDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost);

      if (error) throw error;

      toast({
        title: "Date Updated",
        description: "The posting date has been updated successfully",
      });

      await fetchScheduledPosts();
      setEditDialogOpen(false);
      setEditingPost(null);
      setNewScheduleDate(undefined);
      setSelectedHour('12');
      setSelectedMinute('00');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update posting date",
        variant: "destructive"
      });
    }
  };

  const setTimeForDate = (hours: number, minutes: number) => {
    if (!newScheduleDate) return;
    
    const updatedDate = new Date(newScheduleDate);
    updatedDate.setHours(hours, minutes, 0, 0);
    setNewScheduleDate(updatedDate);
  };

  // Helper function to check if a date has scheduled posts
  const hasScheduledPosts = (date: Date) => {
    return scheduledPosts.some(post => 
      new Date(post.scheduled_date).toDateString() === date.toDateString() &&
      post.status === 'scheduled'
    );
  };

  // Custom day content component for calendar
  const DayContent = ({ date }: DayContentProps) => {
    const hasPost = hasScheduledPosts(date);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
        {hasPost && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-500"></div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-vibrant-purple" />
                {t('schedule.title')}
              </CardTitle>
              <CardDescription>
                {t('schedule.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={cancelAllScheduledPosts}
                disabled={cancellingAll || scheduledPosts.filter(p => p.status === 'scheduled').length === 0}
              >
                {cancellingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('schedule.deleteAll')}
                  </>
                )}
              </Button>
              <Button 
                className="bg-gradient-primary hover:opacity-90"
                onClick={scheduleAutomaticPosts}
                disabled={scheduling}
              >
                {scheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('schedule.schedulePosts')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'weekly')}>
            <TabsList className="grid w-full grid-cols-2 lg:w-auto">
              <TabsTrigger value="daily">{t('schedule.dailyView')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('schedule.weeklyView')}</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('schedule.calendar')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      components={{
                        DayContent: DayContent
                      }}
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
                          new Date(post.scheduled_date).toDateString() === selectedDate?.toDateString() &&
                          post.platform === 'tiktok'
                        )
                        .map((post) => (
                          <div key={post.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            {post.image_path && (
                              <img
                                src={getImageUrl(post.image_path)}
                                alt="Scheduled post"
                                className="h-16 w-16 object-cover rounded-md"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-right mb-2" dir="rtl">
                                {post.caption}
                              </p>
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(post.platform)}
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(post.scheduled_date).toLocaleTimeString()}
                                </span>
                                {getStatusBadge(post.status)}
                              </div>
                            </div>
                            {(post.status === 'scheduled' || post.status === 'failed') && (
                              <div className="flex flex-col gap-2">
                                {post.platform === 'tiktok' && (
                                  <Button 
                                    size="sm" 
                                    className="bg-gradient-primary hover:opacity-90"
                                    onClick={() => startTikTokComplianceFlow(post)}
                                    disabled={postingNow === post.id}
                                  >
                                    {postingNow === post.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Posting...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 mr-1" />
                                        {post.status === 'failed' ? 'Retry Post' : 'Post To TikTok'}
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => startEditDate(post)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {t('schedule.editDate')}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deletePost(post.id)}
                                >
                                  {t('schedule.delete')}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      
                      {scheduledPosts.filter(post => 
                        new Date(post.scheduled_date).toDateString() === selectedDate?.toDateString()
                      ).length === 0 && (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            {t('schedule.noPosts')}
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
                              .filter(post => new Date(post.scheduled_date).toDateString() === date.toDateString() && post.platform === 'tiktok')
                              .map(post => (
                                <div key={post.id} className="p-2 bg-muted rounded text-xs">
                                  <div className="flex items-center gap-1 mb-1">
                                    {getPlatformIcon(post.platform)}
                                    <span>{new Date(post.scheduled_date).toLocaleTimeString([], { 
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

      {/* Edit Date Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Posting Date</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this scheduled post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Calendar
                mode="single"
                selected={newScheduleDate}
                onSelect={setNewScheduleDate}
                className="rounded-md border mt-2 pointer-events-auto"
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const checkDate = new Date(date);
                  checkDate.setHours(0, 0, 0, 0);
                  return checkDate < today;
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Time</label>
              <div className="flex gap-2 items-center">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <span className="text-muted-foreground">:</span>
                
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Selected time: {selectedHour}:{selectedMinute}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updatePostDate} disabled={!newScheduleDate}>
                Update Date
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TikTok Compliance Form */}
      <Dialog open={showTikTokComplianceForm} onOpenChange={setShowTikTokComplianceForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>TikTok Compliance Settings</DialogTitle>
            <DialogDescription>
              Configure your post according to TikTok's Content Sharing Guidelines
            </DialogDescription>
          </DialogHeader>
          {selectedPostForCompliance && (
            <TikTokCompliancePostForm
              post={selectedPostForCompliance}
              onPostSuccess={handleTikTokPostSuccess}
              onCancel={handleTikTokComplianceCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledPosts;
