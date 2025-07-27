-- Apply this SQL in your Supabase SQL Editor to add image enhancement functionality
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this SQL > Run

-- Add image enhancement columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS enhanced_image_path TEXT,
ADD COLUMN IF NOT EXISTS image_enhancement_status TEXT DEFAULT 'none';

-- Add constraint for image_enhancement_status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_image_enhancement_status_check' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_image_enhancement_status_check 
        CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('enhanced_image_path', 'image_enhancement_status'); 