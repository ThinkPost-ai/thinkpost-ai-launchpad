export interface CaptionData {
  id: string;
  image_path: string;
  enhanced_image_path?: string;
  image_enhancement_status?: 'none' | 'processing' | 'completed' | 'failed';
  original_filename?: string;
  name?: string;
  price?: number;
  description?: string;
  caption?: string;
  created_at: string;
  status: 'draft' | 'scheduled' | 'posted';
  type: 'image' | 'product';
  is_new?: boolean;
  content_type?: string; // For general content categorization
  media_type?: string; // For video vs image detection ('photo' | 'video')
  isLoadingPlaceholder?: boolean; // Flag to indicate this is a loading placeholder
  social_stats?: {
    instagram_views?: number;
    instagram_likes?: number;
    tiktok_views?: number;
    tiktok_likes?: number;
  };
}

export interface GeneratedCaptionsProps {
  onCreditsUpdate?: () => void;
}
