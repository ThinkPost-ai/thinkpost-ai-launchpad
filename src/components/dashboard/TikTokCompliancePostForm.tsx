import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import TikTokIcon from '@/components/ui/TikTokIcon';
import { 
  Play, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  MessageCircle,
  Copy,
  Scissors,
  Building,
  DollarSign,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TikTokCreatorInfo {
  username: string;
  display_name: string;
  can_post: boolean;
  max_video_post_duration_sec: number;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
}

interface ScheduledPost {
  id: string;
  caption: string;
  image_path?: string;
  product_name?: string;
  scheduled_date: string;
  platform: string;
  status: string;
}

interface TikTokCompliancePostFormProps {
  post: ScheduledPost;
  onPostSuccess: () => void;
  onCancel: () => void;
}

const TikTokCompliancePostForm = ({ post, onPostSuccess, onCancel }: TikTokCompliancePostFormProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  // Creator Info State
  const [creatorInfo, setCreatorInfo] = useState<TikTokCreatorInfo | null>(null);
  const [loadingCreatorInfo, setLoadingCreatorInfo] = useState(true);
  const [creatorInfoError, setCreatorInfoError] = useState<string | null>(null);
  
  // Form State
  const [caption, setCaption] = useState(post.caption || '');
  const [privacyLevel, setPrivacyLevel] = useState<string>('');
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  
  // Commercial Content State
  const [commercialContentToggle, setCommercialContentToggle] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  
  // UI State
  const [isPosting, setIsPosting] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaDuration, setMediaDuration] = useState<number>(0);

  // Load creator info on component mount
  useEffect(() => {
    fetchCreatorInfo();
    determineMediaType();
  }, []);

  const fetchCreatorInfo = async () => {
    try {
      setLoadingCreatorInfo(true);
      setCreatorInfoError(null);

      const { data, error } = await supabase.functions.invoke('tiktok-creator-info', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch creator info');
      }

      setCreatorInfo(data.creatorInfo);
    } catch (error: any) {
      console.error('Error fetching creator info:', error);
      setCreatorInfoError(error.message);
      toast({
        title: "Creator Info Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingCreatorInfo(false);
    }
  };

  const determineMediaType = () => {
    if (!post.image_path) return;
    
    const isVideo = post.image_path.toLowerCase().endsWith('.mp4') || 
                   post.image_path.toLowerCase().endsWith('.mov') || 
                   post.image_path.toLowerCase().endsWith('.avi');
    
    setMediaType(isVideo ? 'video' : 'photo');
    setMediaUrl(`https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${post.image_path}`);
  };

  // Privacy level formatting
  const formatPrivacyOption = (option: string) => {
    switch (option) {
      case 'SELF_ONLY':
        return 'Only Me';
      case 'MUTUAL_FOLLOW_FRIENDS':
        return 'Friends';
      case 'PUBLIC_TO_EVERYONE':
        return 'Everyone';
      case 'FOLLOWER_OF_CREATOR':
        return 'Public';
      default:
        return option;
    }
  };

  // Commercial content validation
  const isCommercialValid = () => {
    if (!commercialContentToggle) return true;
    return yourBrand || brandedContent;
  };

  // Privacy validation for branded content
  const isPrivacyValidForBranded = (privacy: string) => {
    if (!brandedContent) return true;
    return privacy !== 'SELF_ONLY';
  };

  // Form validation
  const isFormValid = () => {
    if (!privacyLevel) return false;
    if (!isCommercialValid()) return false;
    if (brandedContent && privacyLevel === 'SELF_ONLY') return false;
    if (mediaType === 'video' && mediaDuration > (creatorInfo?.max_video_post_duration_sec || 180)) return false;
    return true;
  };

  // Generate compliance declaration
  const getComplianceDeclaration = () => {
    if (commercialContentToggle && (brandedContent || (yourBrand && brandedContent))) {
      return "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation";
    }
    return "By posting, you agree to TikTok's Music Usage Confirmation";
  };

  // Handle checkbox changes with proper CheckedState handling
  const handleAllowCommentChange = (checked: boolean | "indeterminate") => {
    setAllowComment(checked === true);
  };

  const handleAllowDuetChange = (checked: boolean | "indeterminate") => {
    setAllowDuet(checked === true);
  };

  const handleAllowStitchChange = (checked: boolean | "indeterminate") => {
    setAllowStitch(checked === true);
  };

  const handleCommercialToggle = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setCommercialContentToggle(isChecked);
    if (!isChecked) {
      setYourBrand(false);
      setBrandedContent(false);
    }
  };

  const handleYourBrandChange = (checked: boolean | "indeterminate") => {
    setYourBrand(checked === true);
  };

  // Handle branded content selection
  const handleBrandedContentChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setBrandedContent(isChecked);
    if (isChecked && privacyLevel === 'SELF_ONLY') {
      setPrivacyLevel(''); // Reset privacy if incompatible
    }
  };

  // Handle privacy change
  const handlePrivacyChange = (value: string) => {
    if (value === 'SELF_ONLY' && brandedContent) {
      // Show warning but don't allow selection
      toast({
        title: "Privacy Restriction",
        description: "Branded content visibility cannot be set to private",
        variant: "destructive"
      });
      return;
    }
    setPrivacyLevel(value);
  };

  // Handle post submission
  const handlePost = async () => {
    if (!isFormValid()) {
      toast({
        title: "Form Validation Error",
        description: "Please complete all required fields correctly",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);

    try {
      // Prepare media if needed
      let finalMediaUrl = mediaUrl;
      
      if (mediaType === 'photo') {
        toast({
          title: "Preparing Image",
          description: "Preparing your image for TikTok photo posting...",
        });

        const { data: processingData, error: processingError } = await supabase.functions.invoke('process-image-for-tiktok', {
          body: {
            imageUrl: mediaUrl,
            scheduledPostId: post.id
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (processingError) {
          throw new Error(`Image processing failed: ${processingError.message}`);
        }

        if (!processingData.success || !processingData.proxyImageUrl) {
          throw new Error('Image processing completed but no image URL received');
        }

        finalMediaUrl = processingData.proxyImageUrl;
      }

      toast({
        title: "Posting to TikTok",
        description: "Uploading your content to TikTok...",
      });

      // Post to TikTok with compliance data
      const { data, error } = await supabase.functions.invoke('post-to-tiktok', {
        body: {
          scheduledPostId: post.id,
          videoUrl: finalMediaUrl,
          caption: caption,
          privacyLevel: privacyLevel,
          allowComment: allowComment,
          allowDuet: allowDuet,
          allowStitch: allowStitch,
          commercialContent: commercialContentToggle,
          yourBrand: yourBrand,
          brandedContent: brandedContent,
        },
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

      onPostSuccess();
    } catch (error: any) {
      console.error('Error posting to TikTok:', error);
      toast({
        title: "Posting Failed",
        description: error.message || "Failed to post to TikTok",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (loadingCreatorInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading TikTok creator information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (creatorInfoError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {creatorInfoError}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchCreatorInfo} variant="outline">
              Retry
            </Button>
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creatorInfo?.can_post) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cannot post at this time. You may have reached your posting limit. Please try again later.
            </AlertDescription>
          </Alert>
          <Button onClick={onCancel} className="mt-4" variant="outline">
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Creator Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black">
              <TikTokIcon className="h-6 w-6 text-white" size={24} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Post to TikTok
                <Badge variant="outline">@{creatorInfo.display_name}</Badge>
              </CardTitle>
              <CardDescription>
                Posting to: @{creatorInfo.display_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden max-h-64">
              {mediaType === 'video' ? (
                <video 
                  src={mediaUrl} 
                  controls 
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => setMediaDuration(e.currentTarget.duration)}
                />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Video Duration Check */}
            {mediaType === 'video' && mediaDuration > (creatorInfo.max_video_post_duration_sec || 180) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Video duration ({Math.round(mediaDuration)}s) exceeds maximum allowed duration ({creatorInfo.max_video_post_duration_sec}s)
                </AlertDescription>
              </Alert>
            )}

            {/* Editable Caption */}
            <div>
              <label className="text-sm font-medium mb-2 block">Caption (editable)</label>
              <Textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Enter your caption..."
                className="min-h-[80px]"
                maxLength={2200}
              />
              <p className="text-xs text-muted-foreground mt-1">{caption.length}/2200 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Posting Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posting Settings</CardTitle>
            <CardDescription>Configure your post settings according to TikTok guidelines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Privacy Level - REQUIRED */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                Privacy Level 
                <span className="text-red-500">*</span>
              </label>
              <Select value={privacyLevel} onValueChange={handlePrivacyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy level" />
                </SelectTrigger>
                <SelectContent>
                  {creatorInfo.privacy_level_options.map((option) => (
                    <SelectItem 
                      key={option}
                      value={option}
                      disabled={option === 'SELF_ONLY' && brandedContent}
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {formatPrivacyOption(option)}
                        {option === 'SELF_ONLY' && brandedContent && (
                          <span className="text-xs text-muted-foreground">(Not available for branded content)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Warning message when branded content restricts privacy */}
              {brandedContent && creatorInfo.privacy_level_options.includes('SELF_ONLY') && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    "Only Me" privacy setting is not available for branded content
                  </p>
                </div>
              )}
              
              {brandedContent && privacyLevel === 'SELF_ONLY' && (
                <p className="text-xs text-destructive mt-1">Branded content visibility cannot be set to private</p>
              )}
            </div>

            {/* Interaction Settings */}
            <div>
              <label className="text-sm font-medium mb-3 block">Interaction Settings</label>
              <p className="text-xs text-muted-foreground mb-3">Users must manually enable these settings:</p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allow-comment"
                    checked={allowComment}
                    onCheckedChange={handleAllowCommentChange}
                    disabled={creatorInfo.comment_disabled}
                    className="h-5 w-5"
                  />
                  <label 
                    htmlFor="allow-comment" 
                    className={`text-sm flex items-center gap-2 ${creatorInfo.comment_disabled ? 'text-muted-foreground' : ''}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Allow Comments
                    {creatorInfo.comment_disabled && <Badge variant="secondary" className="text-xs">Disabled in settings</Badge>}
                  </label>
                </div>

                {/* Only show for videos, not photos */}
                {mediaType === 'video' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="allow-duet"
                        checked={allowDuet}
                        onCheckedChange={handleAllowDuetChange}
                        disabled={creatorInfo.duet_disabled}
                        className="h-5 w-5"
                      />
                      <label 
                        htmlFor="allow-duet" 
                        className={`text-sm flex items-center gap-2 ${creatorInfo.duet_disabled ? 'text-muted-foreground' : ''}`}
                      >
                        <Copy className="h-4 w-4" />
                        Allow Duet
                        {creatorInfo.duet_disabled && <Badge variant="secondary" className="text-xs">Disabled in settings</Badge>}
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="allow-stitch"
                        checked={allowStitch}
                        onCheckedChange={handleAllowStitchChange}
                        disabled={creatorInfo.stitch_disabled}
                        className="h-5 w-5"
                      />
                      <label 
                        htmlFor="allow-stitch" 
                        className={`text-sm flex items-center gap-2 ${creatorInfo.stitch_disabled ? 'text-muted-foreground' : ''}`}
                      >
                        <Scissors className="h-4 w-4" />
                        Allow Stitch
                        {creatorInfo.stitch_disabled && <Badge variant="secondary" className="text-xs">Disabled in settings</Badge>}
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Commercial Content Disclosure */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="commercial-content"
                  checked={commercialContentToggle}
                  onCheckedChange={handleCommercialToggle}
                  className="h-5 w-5"
                />
                <label htmlFor="commercial-content" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  This content promotes a brand, product or service
                </label>
              </div>

              {commercialContentToggle && (
                <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="your-brand"
                      checked={yourBrand}
                      onCheckedChange={handleYourBrandChange}
                      className="flex-shrink-0 h-4 w-4"
                    />
                    <label htmlFor="your-brand" className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Your Brand
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="branded-content"
                      checked={brandedContent}
                      onCheckedChange={handleBrandedContentChange}
                      disabled={privacyLevel === 'SELF_ONLY'}
                      className="flex-shrink-0 h-4 w-4"
                    />
                    <label htmlFor="branded-content" className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Branded Content
                    </label>
                  </div>

                  {/* TikTok Compliance Messaging */}
                  {(yourBrand || brandedContent) && (
                    <Alert className="ml-6">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {brandedContent 
                          ? `Your ${mediaType} will be labeled as 'Paid partnership'`
                          : `Your ${mediaType} will be labeled as 'Promotional content'`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Validation message */}
                  {commercialContentToggle && !isCommercialValid() && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              You need to indicate if your content promotes yourself, a third party, or both.
                            </AlertDescription>
                          </Alert>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select at least one option to proceed with commercial content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            {/* Compliance Declaration */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Compliance Declaration</h4>
              <p className="text-sm text-muted-foreground">
                {getComplianceDeclaration()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={onCancel}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePost}
                disabled={!isFormValid() || isPosting}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Post to TikTok
                  </>
                )}
              </Button>
            </div>

            {/* Processing Notice */}
            {isPosting && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your content is being processed. It may take a few minutes to appear on your profile.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TikTokCompliancePostForm;
