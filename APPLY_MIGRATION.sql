-- Enhanced Image Migration for Products Table
-- This migration adds the necessary columns for image enhancement functionality

-- Check if columns already exist and add them if they don't
DO $$ 
BEGIN
    -- Add enhanced_image_path column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'enhanced_image_path'
    ) THEN
        ALTER TABLE products ADD COLUMN enhanced_image_path TEXT;
        RAISE NOTICE 'Added enhanced_image_path column to products table';
    ELSE
        RAISE NOTICE 'enhanced_image_path column already exists';
    END IF;

    -- Add image_enhancement_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_enhancement_status'
    ) THEN
        ALTER TABLE products ADD COLUMN image_enhancement_status TEXT DEFAULT 'none';
        RAISE NOTICE 'Added image_enhancement_status column to products table';
    ELSE
        RAISE NOTICE 'image_enhancement_status column already exists';
    END IF;

    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'products_image_enhancement_status_check'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_image_enhancement_status_check 
        CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed'));
        RAISE NOTICE 'Added check constraint for image_enhancement_status';
    ELSE
        RAISE NOTICE 'Check constraint already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('enhanced_image_path', 'image_enhancement_status')
ORDER BY column_name; 