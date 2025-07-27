-- Step-by-step migration for image enhancement
-- Run each SQL statement separately to avoid timeout issues

-- Step 1: Add enhanced_image_path column
ALTER TABLE products ADD COLUMN IF NOT EXISTS enhanced_image_path TEXT;

-- Step 2: Add image_enhancement_status column
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_enhancement_status TEXT DEFAULT 'none';

-- Step 3: Add constraint (run this separately)
ALTER TABLE products ADD CONSTRAINT products_image_enhancement_status_check 
CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed'));

-- Step 4: Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('enhanced_image_path', 'image_enhancement_status'); 