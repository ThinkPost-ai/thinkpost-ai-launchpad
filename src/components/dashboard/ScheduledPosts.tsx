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
  video_url?: string;
  image_url?: string;
  video_path?: string;
  tiktok_settings?: {
    enabled: boolean;
    privacyLevel: string;
    allowComments: boolean;
    commercialContent: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  } | null;
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
  const [postsLocked, setPostsLocked] = useState(false);
  
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
          products(
            name, 
            image_path, 
            tiktok_enabled,
            tiktok_privacy_level,
            tiktok_allow_comments,
            tiktok_commercial_content,
            tiktok_your_brand,
            tiktok_branded_content
          ),
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
        product_name: post.products?.name,
        video_url: post.video_url,
        image_url: post.image_url,
        video_path: post.video_path,
        // Include TikTok settings if available
        tiktok_settings: post.products ? {
          enabled: post.products.tiktok_enabled,
          privacyLevel: post.products.tiktok_privacy_level,
          allowComments: post.products.tiktok_allow_comments,
          commercialContent: post.products.tiktok_commercial_content,
          yourBrand: post.products.tiktok_your_brand,
          brandedContent: post.products.tiktok_branded_content
        } : null
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

  // Helper function to determine media type from file extension
  const getMediaTypeFromPath = (filePath: string): 'photo' | 'video' => {
    if (!filePath) return 'photo';
    
    const extension = filePath.toLowerCase().split('.').pop();
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
    
    return videoExtensions.includes(extension || '') ? 'video' : 'photo';
  };

  const generateSchedule = () => {
    const schedule = [];
    const now = new Date();
    const startDate = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // Start 2 hours from now

    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(scheduleDate.getDate() + (week * 7) + day);
        
        // Set random time between 9 AM and 9 PM
        const randomHour = Math.floor(Math.random() * 12) + 9;
        const randomMinute = Math.floor(Math.random() * 60);
        scheduleDate.setHours(randomHour, randomMinute, 0, 0);
        
        schedule.push(scheduleDate);
      }
    }

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
          status: 'scheduled' as const,
          media_type: getMediaTypeFromPath(mediaItem.file_path)
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

  // Direct TikTok posting function using stored settings
  const postToTikTokDirectly = async (post: ScheduledPost) => {
    try {
      setPostingNow(post.id);
      
      toast({
        title: "Posting to TikTok",
        description: "Uploading your content to TikTok...",
      });

      // Get TikTok settings from the post's associated product
      let tiktokSettings = post.tiktok_settings;
      
      // If no TikTok settings on the post, fetch from the product
      if (!tiktokSettings && post.product_id) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('tiktok_enabled, tiktok_privacy_level, tiktok_allow_comments, tiktok_commercial_content, tiktok_your_brand, tiktok_branded_content')
          .eq('id', post.product_id)
          .single();

        if (productError) {
          throw new Error('Failed to fetch product TikTok settings');
        }

        if (productData && productData.tiktok_enabled) {
          tiktokSettings = {
            enabled: productData.tiktok_enabled,
            privacyLevel: productData.tiktok_privacy_level || 'public',
            allowComments: productData.tiktok_allow_comments || true,
            commercialContent: productData.tiktok_commercial_content || false,
            yourBrand: productData.tiktok_your_brand || false,
            brandedContent: productData.tiktok_branded_content || false,
          };
        }
      }

      // Use default settings if no TikTok settings found
      if (!tiktokSettings) {
        tiktokSettings = {
          enabled: true,
          privacyLevel: 'public',
          allowComments: true,
          commercialContent: false,
          yourBrand: false,
          brandedContent: false,
        };
      }

      // Map privacy level from frontend format to TikTok API format
      const privacyMapping: { [key: string]: string } = {
        'public': 'PUBLIC_TO_EVERYONE',
        'friends': 'MUTUAL_FOLLOW_FRIENDS',
        'only_me': 'SELF_ONLY'
      };

      // Get the media URL - check for video first, then image, then fallback to product image
      let finalMediaUrl = '';
      
      // Check for direct video or image URLs first
      if (post.video_url) {
        finalMediaUrl = post.video_url;
      } else if (post.image_url) {
        finalMediaUrl = post.image_url;
      } else if (post.video_path) {
        finalMediaUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${post.video_path}`;
      } else if (post.image_path) {
        finalMediaUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${post.image_path}`;
      }

      if (!finalMediaUrl) {
        throw new Error('No media URL found for this post');
      }

      // Prepare the request body with stored settings
      const requestBody: any = {
        scheduledPostId: post.id,
        videoUrl: finalMediaUrl,
        privacyLevel: privacyMapping[tiktokSettings.privacyLevel] || 'PUBLIC_TO_EVERYONE',
        allowComment: tiktokSettings.allowComments,
        allowDuet: true, // Default to true, can be enhanced to store this setting
        allowStitch: true, // Default to true, can be enhanced to store this setting
        commercialContent: tiktokSettings.commercialContent,
        yourBrand: tiktokSettings.yourBrand,
        brandedContent: tiktokSettings.brandedContent,
      };

      // Add caption as title
      if (post.caption && post.caption.trim()) {
        requestBody.title = post.caption.trim();
      }

      const { data, error } = await supabase.functions.invoke('post-to-tiktok', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Posted to TikTok!",
        description: "Your post has been successfully published to TikTok",
      });

      // Refresh the posts list
      await fetchScheduledPosts();
    } catch (error: any) {
      console.error('Error posting to TikTok:', error);
      toast({
        title: "Posting Failed",
        description: error.message || "Failed to post to TikTok",
        variant: "destructive"
      });
    } finally {
      setPostingNow(null);
    }
  };

  const handleReviewedAndSubmitted = () => {
    setPostsLocked(true);
    toast({
      title: "Posts Locked",
      description: "All scheduled posts have been locked and are no longer editable.",
    });
  };

  const handleCancelScheduledPostsAndEdits = () => {
    setPostsLocked(false);
    toast({
      title: "Posts Unlocked",
      description: "All scheduled posts are now editable again.",
    });
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
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={cancelAllScheduledPosts}
                disabled={cancellingAll || scheduledPosts.filter(p => p.status === 'scheduled').length === 0 || postsLocked}
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
                disabled={scheduling || postsLocked}
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
                    
                    {/* Lock/Unlock Buttons - Only show if there are scheduled posts */}
                    {scheduledPosts.filter(p => p.status === 'scheduled').length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {!postsLocked ? (
                          <Button 
                            variant="default"
                            onClick={handleReviewedAndSubmitted}
                            className="bg-green-600 hover:bg-green-700 w-full"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {t('schedule.reviewedAndSubmitted')}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            onClick={handleCancelScheduledPostsAndEdits}
                            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-300 w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('schedule.cancelScheduledPostsAndEdits')}
                          </Button>
                        )}
                      </div>
                    )}
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
                                    onClick={() => postToTikTokDirectly(post)}
                                    disabled={postingNow === post.id || postsLocked}
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
                                  disabled={postsLocked}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {t('schedule.editDate')}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deletePost(post.id)}
                                  disabled={postsLocked}
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
    </div>
  );
};

export default ScheduledPosts;
