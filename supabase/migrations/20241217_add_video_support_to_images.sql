-- Add new columns to support video files and public URLs
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'image/jpeg';

-- Update existing records to use file_path as url if url is null
UPDATE images 
SET url = file_path,
    file_name = original_filename,
    mime_type = CASE 
        WHEN LOWER(original_filename) LIKE '%.jpg' OR LOWER(original_filename) LIKE '%.jpeg' THEN 'image/jpeg'
        WHEN LOWER(original_filename) LIKE '%.png' THEN 'image/png'
        WHEN LOWER(original_filename) LIKE '%.gif' THEN 'image/gif'
        WHEN LOWER(original_filename) LIKE '%.mp4' THEN 'video/mp4'
        WHEN LOWER(original_filename) LIKE '%.mov' THEN 'video/quicktime'
        WHEN LOWER(original_filename) LIKE '%.avi' THEN 'video/x-msvideo'
        ELSE 'image/jpeg'
    END
WHERE url IS NULL;

-- Create index on user_id and mime_type for better query performance
CREATE INDEX IF NOT EXISTS idx_images_user_mime ON images(user_id, mime_type);

-- Create index on public_url for proxy lookups
CREATE INDEX IF NOT EXISTS idx_images_public_url ON images(public_url) WHERE public_url IS NOT NULL; 