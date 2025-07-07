export interface CaptionData {
  id: string;
  image_path: string;
  original_filename?: string;
  name?: string;
  price?: number;
  description?: string;
  caption?: string;
  created_at: string;
  status: 'draft' | 'scheduled' | 'posted';
  type: 'image' | 'product';
  is_new?: boolean;
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
