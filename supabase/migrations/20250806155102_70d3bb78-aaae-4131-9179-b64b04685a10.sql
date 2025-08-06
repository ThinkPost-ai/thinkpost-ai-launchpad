-- Update image_enhancement_status enum to include temp_ready status
-- This allows the server to indicate when an enhanced image is ready for client-side compression

-- First check if the column exists and its current type
DO $$
BEGIN
    -- Add temp_ready to the existing enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'temp_ready' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'image_enhancement_status'
        )
    ) THEN
        ALTER TYPE image_enhancement_status ADD VALUE 'temp_ready';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If the enum doesn't exist, create it with all values
        CREATE TYPE image_enhancement_status AS ENUM ('none', 'processing', 'temp_ready', 'completed', 'failed');
END $$;