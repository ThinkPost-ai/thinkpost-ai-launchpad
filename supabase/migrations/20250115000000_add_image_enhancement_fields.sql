-- Add image enhancement fields to products table
ALTER TABLE products 
ADD COLUMN enhanced_image_path TEXT,
ADD COLUMN image_enhancement_status TEXT DEFAULT 'none' CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed')); 