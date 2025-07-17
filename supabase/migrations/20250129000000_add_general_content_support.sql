-- Add columns to support general content upload functionality

-- Add content_type column for categorizing general content
ALTER TABLE public.images 
ADD COLUMN content_type text,
ADD COLUMN description text,
ADD COLUMN media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
ADD COLUMN tiktok_enabled boolean DEFAULT false,
ADD COLUMN instagram_enabled boolean DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX idx_images_content_type ON public.images(content_type);
CREATE INDEX idx_images_media_type ON public.images(media_type);
CREATE INDEX idx_images_tiktok_enabled ON public.images(tiktok_enabled);
CREATE INDEX idx_images_instagram_enabled ON public.images(instagram_enabled);

-- Add comment to document the content_type column
COMMENT ON COLUMN public.images.content_type IS 'Type of general content: venue, busy, preparation, atmosphere, behindScenes, customerMessages, educational, events, announcement, random';
COMMENT ON COLUMN public.images.description IS 'Optional description for the content item';
COMMENT ON COLUMN public.images.media_type IS 'Type of media: photo or video';
COMMENT ON COLUMN public.images.tiktok_enabled IS 'Whether this content should be posted to TikTok';
COMMENT ON COLUMN public.images.instagram_enabled IS 'Whether this content should be posted to Instagram'; 