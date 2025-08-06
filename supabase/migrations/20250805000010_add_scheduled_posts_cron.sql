-- Fix scheduled posts to include TikTok settings and approval mechanism
-- Note: Automatic processing will need to be triggered externally (every 5 minutes)

-- Add missing TikTok settings columns to scheduled_posts table
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS tiktok_privacy_level TEXT DEFAULT 'PUBLIC_TO_EVERYONE',
ADD COLUMN IF NOT EXISTS tiktok_allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tiktok_commercial_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_your_brand BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_branded_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_disable_duet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_disable_stitch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_publish_id TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processed_image_path TEXT,
ADD COLUMN IF NOT EXISTS video_path TEXT;

-- Update existing scheduled posts to have approved_at timestamp
-- This will allow them to be processed immediately
UPDATE public.scheduled_posts 
SET approved_at = NOW() 
WHERE approved_at IS NULL 
  AND status = 'scheduled'
  AND platform = 'tiktok';

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due_for_processing 
ON public.scheduled_posts (platform, status, scheduled_date, approved_at) 
WHERE approved_at IS NOT NULL;

-- Create a function to automatically approve new scheduled posts
CREATE OR REPLACE FUNCTION auto_approve_scheduled_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve TikTok posts when they are created
  IF NEW.platform = 'tiktok' AND NEW.status = 'scheduled' AND NEW.approved_at IS NULL THEN
    NEW.approved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-approve scheduled posts
DROP TRIGGER IF EXISTS trigger_auto_approve_scheduled_posts ON public.scheduled_posts;
CREATE TRIGGER trigger_auto_approve_scheduled_posts
  BEFORE INSERT ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_scheduled_posts(); 