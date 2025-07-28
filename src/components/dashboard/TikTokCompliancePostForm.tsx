import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  tiktok_settings?: {
    enabled: boolean;
    privacyLevel: string;
    allowComments: boolean;
    commercialContent: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  } | null;
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

  // Add new state for title (add this near other state declarations)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(post.caption || '');

  // Load creator info on component mount
  useEffect(() => {
    fetchCreatorInfo();
    determineMediaType();
    
    // Debug: Log the complete post object
    console.log('🔍 Complete post object in TikTokCompliancePostForm:', post);
    
    // Test if enhanced image columns exist
    const testEnhancementColumns = async () => {
      try {
        console.log('Testing if enhancement columns exist...');
        const { data, error } = await supabase
          .from('products')
          .select('id, enhanced_image_path, image_enhancement_status')
          .limit(1);
        
        if (error) {
          console.log('❌ Enhancement columns do not exist or error:', error);
        } else {
          console.log('✅ Enhancement columns exist, sample data:', data);
        }
      } catch (error) {
        console.log('❌ Error testing enhancement columns:', error);
      }
    };
    
    testEnhancementColumns();
  }, []);

  // Initialize form with stored TikTok settings
  useEffect(() => {
    if (post.tiktok_settings) {
      const settings = post.tiktok_settings;
      
      // Map privacy level from database format to TikTok API format
      const privacyMapping: { [key: string]: string } = {
        'public': 'PUBLIC_TO_EVERYONE',
        'friends': 'MUTUAL_FOLLOW_FRIENDS',
        'only_me': 'SELF_ONLY'
      };
      
      setPrivacyLevel(privacyMapping[settings.privacyLevel] || '');
      setAllowComment(settings.allowComments);
      setCommercialContentToggle(settings.commercialContent);
      setYourBrand(settings.yourBrand);
      setBrandedContent(settings.brandedContent);
    }
  }, [post.tiktok_settings]);

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

  const determineMediaType = async () => {
    if (!post.image_path) return;
    
    console.log('=== TikTok Compliance Form Debug ===');
    console.log('Post data:', {
      id: post.id,
      product_id: post.product_id,
      image_id: post.image_id,
      image_path: post.image_path
    });
    
    // Get enhanced image path if available
    let finalImagePath = post.image_path;
    
    // Check if this is a product and if it has an enhanced image
    if (post.product_id) {
      try {
        console.log('Checking for enhanced image for product:', post.product_id);
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('enhanced_image_path, image_enhancement_status')
          .eq('id', post.product_id)
          .single();

        console.log('Product enhancement data:', {
          data: productData,
          error: productError
        });

        if (!productError && productData) {
          const enhancedPath = (productData as any).enhanced_image_path;
          const enhancementStatus = (productData as any).image_enhancement_status;
          
          console.log('Enhancement status:', enhancementStatus);
          console.log('Enhanced path:', enhancedPath);
          
          // Use enhanced image if available and completed
          if (enhancedPath && enhancementStatus === 'completed') {
            finalImagePath = enhancedPath;
            console.log('✅ Using enhanced image for preview:', enhancedPath);
          } else {
            console.log('❌ Using original image - enhanced not available or not completed');
          }
        }
      } catch (error) {
        console.log('❌ Could not fetch enhanced image info for preview, using original:', error);
      }
    } else {
      console.log('❌ No product_id found, using original image');
    }
    
    console.log('Final image path for preview:', finalImagePath);
    console.log('=====================================');
    
    const isVideo = finalImagePath.toLowerCase().endsWith('.mp4') || 
                   finalImagePath.toLowerCase().endsWith('.mov') || 
                   finalImagePath.toLowerCase().endsWith('.avi');
    
    setMediaType(isVideo ? 'video' : 'photo');
    setMediaUrl(`https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${finalImagePath}`);
  };

  // Privacy level formatting
  const formatPrivacyOption = (option: string) => {
    switch (option) {
      case 'PUBLIC_TO_EVERYONE':
        return 'Public';
      case 'MUTUAL_FOLLOW_FRIENDS':
        return 'Friends';
      case 'SELF_ONLY':
        return 'Only me';
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

  // Generate compliance declaration with proper links
  const getComplianceDeclaration = () => {
    if (commercialContentToggle && brandedContent) {
      // When Branded Content is selected (alone or with Your Brand)
      return (
        <span>
          By posting, you agree to TikTok's{' '}
          <a 
            href="https://www.tiktok.com/legal/page/global/bc-policy/en" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Branded Content Policy
          </a>{' '}
          and{' '}
          <a 
            href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Music Usage Confirmation
          </a>
        </span>
      );
    }
    // Default case (no commercial content, or only Your Brand selected)
    return (
      <span>
        By posting, you agree to TikTok's{' '}
        <a 
          href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Music Usage Confirmation
        </a>
      </span>
    );
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
        title: "Form Validation Failed",
        description: "Please check all fields and requirements",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsPosting(true);
      
      toast({
        title: "Posting to TikTok",
        description: "Uploading your content to TikTok...",
      });
      
      console.log('=== TikTok Posting Debug ===');
      console.log('Post data for posting:', {
        id: post.id,
        product_id: post.product_id,
        image_id: post.image_id,
        image_path: post.image_path
      });
      
      // Get enhanced image path if available
      let finalImagePath = post.image_path;
      
      // Check if this is a product and if it has an enhanced image
      if (post.product_id) {
        try {
          console.log('Checking for enhanced image for posting, product:', post.product_id);
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('enhanced_image_path, image_enhancement_status')
            .eq('id', post.product_id)
            .single();

          console.log('Product enhancement data for posting:', {
            data: productData,
            error: productError
          });

          if (!productError && productData) {
            const enhancedPath = (productData as any).enhanced_image_path;
            const enhancementStatus = (productData as any).image_enhancement_status;
            
            console.log('Enhancement status for posting:', enhancementStatus);
            console.log('Enhanced path for posting:', enhancedPath);
            
            // Use enhanced image if available and completed
            if (enhancedPath && enhancementStatus === 'completed') {
              finalImagePath = enhancedPath;
              console.log('✅ Using enhanced image for TikTok posting:', enhancedPath);
            } else {
              console.log('❌ Using original image for posting - enhanced not available or not completed');
            }
          }
        } catch (error) {
          console.log('❌ Could not fetch enhanced image info for posting, using original:', error);
        }
      } else {
        console.log('❌ No product_id found for posting, using original image');
      }
      
      const finalMediaUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${finalImagePath}`;
      console.log('Final media URL for TikTok posting:', finalMediaUrl);
      console.log('===========================');
      
      // Prepare the request body
      const requestBody: any = {
        scheduledPostId: post.id,
        videoUrl: finalMediaUrl,
        privacyLevel: privacyLevel,
        allowComment: allowComment,
        allowDuet: allowDuet,
        allowStitch: allowStitch,
        commercialContent: commercialContentToggle,
        yourBrand: yourBrand,
        brandedContent: brandedContent,
      };

      // Only add title and description if they have content
      if (mediaType === 'photo') {
        if (title.trim()) {
          requestBody.title = title.trim();
        }
        if (description.trim()) {
          requestBody.description = description.trim();
        }
      } else {
        // For videos, use caption as title if it has content
        if (caption.trim()) {
          requestBody.title = caption.trim();
        }
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
                <Badge variant="outline">@{creatorInfo.username}</Badge>
              </CardTitle>
              <CardDescription>
                <span className="font-medium">TikTok Name:</span> {creatorInfo.display_name}
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

            {/* Editable Content */}
            <div className="space-y-4">
              {mediaType === 'photo' ? (
                // Photo posts: separate title and description
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title (optional)</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a catchy title..."
                      maxLength={90}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{title.length}/90 characters</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter your description with hashtags and mentions..."
                      className="min-h-[80px]"
                      maxLength={4000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{description.length}/4000 characters</p>
                  </div>
                </>
              ) : (
                // Video posts: single caption field (becomes title)
                <div>
                  <label className="text-sm font-medium mb-2 block">Caption</label>
                  <Textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter your caption..."
                    className="min-h-[80px]"
                    maxLength={2200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{caption.length}/2200 characters</p>
                </div>
              )}
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
            
            {/* Privacy Level - REQUIRED - Now using Radio Buttons */}
            <div>
              <label className="text-sm font-medium mb-3 block flex items-center gap-1">
                Privacy Level 
                <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">Users must manually select the privacy status from the options below:</p>
              
              <RadioGroup value={privacyLevel} onValueChange={handlePrivacyChange}>
                {creatorInfo.privacy_level_options.map((option) => {
                  // Handle SELF_ONLY restrictions for branded content
                  const isDisabled = option === 'SELF_ONLY' && brandedContent;
                  
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option}
                          id={option}
                          disabled={isDisabled}
                        />
                        <label 
                          htmlFor={option}
                          className={`text-sm flex items-center gap-2 cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                        >
                          <Eye className="h-4 w-4" />
                          {formatPrivacyOption(option)}
                          {isDisabled && <Badge variant="secondary" className="text-xs">Not available for branded content</Badge>}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
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
                    className="flex-shrink-0 h-4 w-4"
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
                        className="flex-shrink-0 h-4 w-4"
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
                        className="flex-shrink-0 h-4 w-4"
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
                  className="flex-shrink-0 h-4 w-4"
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
                          <div className="cursor-help">
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                You need to indicate if your content promotes yourself, a third party, or both.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You need to indicate if your content promotes yourself, a third party, or both.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Additional hover guidance for disabled publish button */}
                  {commercialContentToggle && !isCommercialValid() && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 Hover over the message above for more details
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Compliance Declaration */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Compliance Declaration</h4>
              <div className="text-sm text-muted-foreground">
                {getComplianceDeclaration()}
              </div>
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
