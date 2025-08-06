-- Add missing columns to products table that are expected by the frontend
-- This fixes the RLS violation by ensuring all expected columns exist

-- Add is_new column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'is_new' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN is_new boolean DEFAULT false;
    END IF;
END $$;

-- Add enhanced_image_path column if it doesn't exist (should already exist from previous migration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'enhanced_image_path' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN enhanced_image_path TEXT;
    END IF;
END $$;

-- Add image_enhancement_status column if it doesn't exist (should already exist from previous migration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'image_enhancement_status' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN image_enhancement_status TEXT DEFAULT 'none' 
               CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Add selected_version column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'selected_version' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN selected_version TEXT;
    END IF;
END $$;

-- Add TikTok-specific columns that are in the TypeScript types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_enabled' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_enabled boolean DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_privacy_level' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_privacy_level TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_allow_comments' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_allow_comments boolean DEFAULT true;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_commercial_content' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_commercial_content boolean DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_your_brand' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_your_brand boolean DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' 
                   AND column_name = 'tiktok_branded_content' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.products ADD COLUMN tiktok_branded_content boolean DEFAULT false;
    END IF;
END $$; 