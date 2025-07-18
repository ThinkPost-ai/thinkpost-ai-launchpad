import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

// Add custom styles for scheduled days
const scheduledDayStyles = `
  .scheduled-day {
    background: linear-gradient(135deg, rgb(243 232 255) 0%, rgb(219 234 254) 100%);
    color: rgb(88 28 135);
    font-weight: 500;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    border: 1px solid rgb(196 181 253);
  }
  
  .dark .scheduled-day {
    background: linear-gradient(135deg, rgb(88 28 135 / 0.3) 0%, rgb(30 58 138 / 0.3) 100%);
    color: rgb(196 181 253);
    border: 1px solid rgb(88 28 135 / 0.5);
  }
  
  .scheduled-day:hover {
    background: linear-gradient(135deg, rgb(233 213 255) 0%, rgb(191 219 254) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
  
  .dark .scheduled-day:hover {
    background: linear-gradient(135deg, rgb(88 28 135 / 0.4) 0%, rgb(30 58 138 / 0.4) 100%);
  }
`;

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
  approved_at?: string | null;
  media_type?: string; // For video vs image detection ('photo' | 'video')
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
  const { t, isRTL } = useLanguage();
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
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [postingNow, setPostingNow] = useState<string | null>(null);
  const [postsLocked, setPostsLocked] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [schedulingPreferences, setSchedulingPreferences] = useState({
    days: '4-weekly' as '2-weekly' | '4-weekly' | 'daily' | 'custom',
    customDays: [] as string[],
    timeSlot: 'morning' as 'morning' | 'lunch' | 'evening' | 'night' | 'random'
  });
  
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
          images(file_path, media_type)
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
        approved_at: post.approved_at,
        media_type: post.media_type || post.images?.media_type || getMediaTypeFromPath(post.products?.image_path || post.images?.file_path || ''), // Include media_type from database or detect from path
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
      
      // Check if user has approved posts - determine approval state from database
      const hasApprovedPosts = data.some(post => 
        post.status === 'scheduled' && 
        post.platform === 'tiktok' && 
        post.approved_at !== null
      );
      
      // Set postsLocked state based on whether there are approved posts
      setPostsLocked(hasApprovedPosts);
      
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

  const generateScheduleWithPreferences = () => {
    const schedule = [];
    const now = new Date();
    const startDate = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // Start 2 hours from now
    
    // Time slot mappings
    const timeSlotRanges = {
      morning: { start: 7, end: 9 },
      lunch: { start: 12, end: 14 },
      evening: { start: 16, end: 18 },
      night: { start: 19, end: 23 }
    };

    let currentDate = new Date(startDate);
    let postsGenerated = 0;
    const maxPosts = 28; // Generate up to 28 posts

    while (postsGenerated < maxPosts) {
      let shouldScheduleToday = false;

      // Determine if we should schedule on this day based on preferences
      switch (schedulingPreferences.days) {
        case '2-weekly':
          // Schedule 2 days per week (e.g., Monday and Thursday)
          shouldScheduleToday = currentDate.getDay() === 1 || currentDate.getDay() === 4;
          break;
        case '4-weekly':
          // Schedule 4 days per week (Monday, Tuesday, Thursday, Friday)
          shouldScheduleToday = [1, 2, 4, 5].includes(currentDate.getDay());
          break;
        case 'daily':
          shouldScheduleToday = true;
          break;
        case 'custom':
          // Check if current day is in custom selected days
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          shouldScheduleToday = schedulingPreferences.customDays.includes(dayNames[currentDate.getDay()]);
          break;
      }

      if (shouldScheduleToday) {
        if (postsGenerated >= maxPosts) return;
        
        const scheduleDate = new Date(currentDate);
        let selectedTimeSlot = schedulingPreferences.timeSlot;
        
        // If random is selected, pick a random time slot for this post
        if (selectedTimeSlot === 'random') {
          const timeSlotOptions = ['morning', 'lunch', 'evening', 'night'];
          selectedTimeSlot = timeSlotOptions[Math.floor(Math.random() * timeSlotOptions.length)] as keyof typeof timeSlotRanges;
        }
        
        const timeRange = timeSlotRanges[selectedTimeSlot as keyof typeof timeSlotRanges];
        
        // Random time within the slot
        const randomHour = Math.floor(Math.random() * (timeRange.end - timeRange.start)) + timeRange.start;
        const randomMinute = Math.floor(Math.random() * 60);
        
        scheduleDate.setHours(randomHour, randomMinute, 0, 0);
        schedule.push(scheduleDate);
        postsGenerated++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety break after 60 days
      if (currentDate.getTime() - startDate.getTime() > 60 * 24 * 60 * 60 * 1000) {
        break;
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
          title: t('toast.error'),
          description: t('schedule.needContent'),
          variant: "destructive"
        });
        return;
      }

      const schedule = generateScheduleWithPreferences();

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
        title: t('toast.success'),
        description: `${schedule.length} ${t('schedule.tikTokScheduled')}`,
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
        title: t('toast.success'),
        description: t('schedule.allPostsDeleted'),
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

  const handleSchedulingConfirm = async () => {
    setShowSchedulingModal(false);
    await scheduleAutomaticPosts();
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

  const handleReviewedAndSubmitted = async () => {
    try {
      setPostsLocked(true);
      
      // Get all scheduled posts for this user
      const { data: scheduledPostsToApprove, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'scheduled')
        .eq('platform', 'tiktok');

      if (fetchError) throw fetchError;

      if (scheduledPostsToApprove && scheduledPostsToApprove.length > 0) {
        // Approve all scheduled posts by setting approved_at timestamp
        const { error: approveError } = await supabase
          .from('scheduled_posts')
          .update({ 
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)
          .eq('status', 'scheduled')
          .eq('platform', 'tiktok');

        if (approveError) throw approveError;

        toast({
          title: t('schedule.postsLocked'),
          description: t('schedule.postsLockedDesc'),
        });
        
        // Refresh the posts to update the UI state
        await fetchScheduledPosts();
      } else {
        toast({
          title: t('schedule.noPostsToApprove'),
          description: t('schedule.noPostsToApproveDesc'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: t('schedule.approvalError') + ": " + error.message,
        variant: "destructive"
      });
      setPostsLocked(false); // Reset if failed
    }
  };

  const handleCancelScheduledPostsAndEdits = async () => {
    try {
      setPostsLocked(false);
      
      // Remove approval from all scheduled posts by setting approved_at to null
      const { error: unapproveError } = await supabase
        .from('scheduled_posts')
        .update({ 
          approved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'scheduled')
        .eq('platform', 'tiktok');

      if (unapproveError) throw unapproveError;

      toast({
        title: t('schedule.postsUnlocked'),
        description: t('schedule.postsUnlockedDesc'),
      });
      
      // Refresh the posts to update the UI state
      await fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: t('schedule.unapprovalError') + ": " + error.message,
        variant: "destructive"
      });
    }
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

  // Helper functions for 12-hour time conversion
  const convertTo12Hour = (hour24: number) => {
    if (hour24 === 0) return { hour: '12', period: 'AM' as const };
    if (hour24 < 12) return { hour: hour24.toString(), period: 'AM' as const };
    if (hour24 === 12) return { hour: '12', period: 'PM' as const };
    return { hour: (hour24 - 12).toString(), period: 'PM' as const };
  };

  const convertTo24Hour = (hour12: string, period: 'AM' | 'PM') => {
    const hour = parseInt(hour12);
    if (period === 'AM') {
      return hour === 12 ? 0 : hour;
    } else {
      return hour === 12 ? 12 : hour + 12;
    }
  };

  const startEditDate = (post: ScheduledPost) => {
    setEditingPost(post.id);
    const postDate = new Date(post.scheduled_date);
    setNewScheduleDate(postDate);
    
    const { hour, period } = convertTo12Hour(postDate.getHours());
    setSelectedHour(hour.padStart(2, '0'));
    setSelectedMinute(postDate.getMinutes().toString().padStart(2, '0'));
    setSelectedPeriod(period);
    setEditDialogOpen(true);
  };

  const updatePostDate = async () => {
    if (!editingPost || !newScheduleDate) return;

    // Create the final date with selected time (convert from 12-hour to 24-hour)
    const finalDate = new Date(newScheduleDate);
    const hour24 = convertTo24Hour(selectedHour, selectedPeriod);
    finalDate.setHours(hour24, parseInt(selectedMinute), 0, 0);

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
      setSelectedPeriod('PM');
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
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
      </div>
    );
  };

  // Create modifiers for the calendar
  const calendarModifiers = {
    hasScheduledPosts: (date: Date) => hasScheduledPosts(date)
  };

  const calendarModifiersClassNames = {
    hasScheduledPosts: "scheduled-day"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Inject custom styles for scheduled days */}
      <style dangerouslySetInnerHTML={{ __html: scheduledDayStyles }} />
      
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-vibrant-purple" />
              {t('schedule.title')}
            </CardTitle>
            <CardDescription>
              {t('schedule.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'weekly')}>
            <TabsList className="grid w-full grid-cols-1 lg:w-auto">
              <TabsTrigger value="daily">{t('schedule.dailyView')}</TabsTrigger>
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
                      modifiers={calendarModifiers}
                      modifiersClassNames={calendarModifiersClassNames}
                    />
                    
                    {/* Lock/Unlock Buttons - Only show if there are scheduled posts */}
                    {scheduledPosts.filter(p => p.status === 'scheduled').length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {!postsLocked ? (
                          <div className="space-y-2">
                            <Button 
                              variant="default"
                              onClick={handleReviewedAndSubmitted}
                              className="bg-green-600 hover:bg-green-700 w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {t('schedule.reviewedAndSubmitted')}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              {t('schedule.reviewedAndSubmittedNote')}
                            </p>
                          </div>
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
                      {t('schedule.postsFor')} {selectedDate?.toLocaleDateString()}
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
                           <div key={post.id} className="p-4 border rounded-lg">
                             <div className="flex items-start gap-4 mb-3">
                               {post.image_path && (
                                 post.media_type === 'video' ? (
                                   <video
                                     src={getImageUrl(post.image_path)}
                                     className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                                     muted
                                   />
                                 ) : (
                                   <img
                                     src={getImageUrl(post.image_path)}
                                     alt="Scheduled post"
                                     className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                                   />
                                 )
                               )}
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm text-right mb-2" dir="rtl">
                                   {post.caption}
                                 </p>
                                 <div className="flex items-center gap-2 flex-wrap">
                                   {getPlatformIcon(post.platform)}
                                   <Clock className="h-3 w-3 text-muted-foreground" />
                                   <span className="text-sm text-muted-foreground">
                                     {new Date(post.scheduled_date).toLocaleTimeString()}
                                   </span>
                                   {getStatusBadge(post.status)}
                                 </div>
                               </div>
                             </div>
                             {(post.status === 'scheduled' || post.status === 'failed') && (
                               <div className="flex gap-2 justify-end pt-2 border-t">
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => startEditDate(post)}
                                   disabled={postsLocked}
                                   className="text-xs"
                                 >
                                   <Edit className="h-3 w-3 mr-1" />
                                   {t('schedule.editDate')}
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   variant="destructive"
                                   onClick={() => deletePost(post.id)}
                                   disabled={postsLocked}
                                   className="text-xs"
                                 >
                                   <Trash2 className="h-3 w-3 mr-1" />
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Date Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('schedule.editPostingDate')}</DialogTitle>
            <DialogDescription>
              {t('schedule.editPostingDateDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('schedule.date')}</label>
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
              <label className="text-sm font-medium mb-2 block">{t('schedule.time')}</label>
              <div className={`flex gap-2 items-end ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Hour selector */}
                <div className="flex flex-col">
                  <label className="text-xs text-muted-foreground mb-1 text-center">{t('schedule.hour')}</label>
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = (i + 1).toString().padStart(2, '0');
                        return (
                          <SelectItem key={i} value={hour}>
                            {hour}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <span className="text-muted-foreground pb-2">:</span>
                
                {/* Minute selector */}
                <div className="flex flex-col">
                  <label className="text-xs text-muted-foreground mb-1 text-center">{t('schedule.minute')}</label>
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
                
                {/* AM/PM selector */}
                <div className="flex flex-col">
                  <label className="text-xs text-muted-foreground mb-1 text-center">&nbsp;</label>
                  <Select value={selectedPeriod} onValueChange={(value: 'AM' | 'PM') => setSelectedPeriod(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">{t('schedule.am')}</SelectItem>
                      <SelectItem value="PM">{t('schedule.pm')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                {t('schedule.selectedTime')}: {selectedHour}:{selectedMinute} {t(`schedule.${selectedPeriod.toLowerCase()}`)}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t('schedule.cancel')}
              </Button>
              <Button onClick={updatePostDate} disabled={!newScheduleDate}>
                {t('schedule.updateDate')}
              </Button>
            </div>
          </div>
                  </DialogContent>
        </Dialog>

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
          <div className="container mx-auto flex gap-3 justify-center max-w-md">
            <Button 
              variant="outline"
              onClick={cancelAllScheduledPosts}
              disabled={cancellingAll || scheduledPosts.filter(p => p.status === 'scheduled').length === 0 || postsLocked}
              className="flex-1"
            >
              {cancellingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('schedule.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('schedule.deleteAll')}
                </>
              )}
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90 flex-1"
              onClick={() => setShowSchedulingModal(true)}
              disabled={scheduling || postsLocked}
            >
              {scheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('schedule.scheduling')}
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

        {/* Scheduling Preferences Modal */}
        <Dialog open={showSchedulingModal} onOpenChange={setShowSchedulingModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('schedule.preferences.title')}</DialogTitle>
              <DialogDescription>
                {t('schedule.preferences.description')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Scheduling Days */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">{t('schedule.preferences.days')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="2-weekly"
                      name="schedulingDays"
                      checked={schedulingPreferences.days === '2-weekly'}
                      onChange={() => setSchedulingPreferences(prev => ({ ...prev, days: '2-weekly' }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="2-weekly" className="text-sm font-medium">
                      {t('schedule.preferences.days.2weekly')}
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="4-weekly"
                      name="schedulingDays"
                      checked={schedulingPreferences.days === '4-weekly'}
                      onChange={() => setSchedulingPreferences(prev => ({ ...prev, days: '4-weekly' }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="4-weekly" className="text-sm font-medium">
                      {t('schedule.preferences.days.4weekly')}
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="daily"
                      name="schedulingDays"
                      checked={schedulingPreferences.days === 'daily'}
                      onChange={() => setSchedulingPreferences(prev => ({ ...prev, days: 'daily' }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="daily" className="text-sm font-medium">
                      {t('schedule.preferences.days.daily')}
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom"
                      name="schedulingDays"
                      checked={schedulingPreferences.days === 'custom'}
                      onChange={() => setSchedulingPreferences(prev => ({ ...prev, days: 'custom' }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="custom" className="text-sm font-medium">
                      {t('schedule.preferences.days.custom')}
                    </label>
                  </div>
                  
                  {schedulingPreferences.days === 'custom' && (
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`custom-${day}`}
                            checked={schedulingPreferences.customDays.includes(day)}
                            onCheckedChange={(checked) => {
                              setSchedulingPreferences(prev => ({
                                ...prev,
                                customDays: checked
                                  ? [...prev.customDays, day]
                                  : prev.customDays.filter(d => d !== day)
                              }));
                            }}
                          />
                          <label htmlFor={`custom-${day}`} className="text-sm">
                            {t(`schedule.preferences.customDays.${day}`)}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Posting Times */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">{t('schedule.preferences.times')}</h3>
                <div className="space-y-2">
                  {['morning', 'lunch', 'evening', 'night', 'random'].map(timeSlot => (
                    <div key={timeSlot} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`time-${timeSlot}`}
                        name="postingTimes"
                        checked={schedulingPreferences.timeSlot === timeSlot}
                        onChange={() => setSchedulingPreferences(prev => ({ ...prev, timeSlot: timeSlot as any }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`time-${timeSlot}`} className="text-sm font-medium">
                        {t(`schedule.preferences.times.${timeSlot}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSchedulingModal(false)}
                >
                  {t('schedule.preferences.cancel')}
                </Button>
                <Button 
                  onClick={handleSchedulingConfirm}
                  disabled={schedulingPreferences.days === 'custom' && schedulingPreferences.customDays.length === 0}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {scheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('schedule.preferences.confirm')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

export default ScheduledPosts;
