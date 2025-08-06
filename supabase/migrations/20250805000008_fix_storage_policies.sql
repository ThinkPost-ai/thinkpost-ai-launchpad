-- Fix storage policies for restaurant-images bucket
-- The actual RLS violation is happening in storage, not the products table

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;

-- Create comprehensive storage policies for restaurant-images bucket
CREATE POLICY "Allow authenticated users to upload to restaurant-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to view restaurant-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Allow authenticated users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also allow service role full access for edge functions
CREATE POLICY "Service role has full access to restaurant-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'restaurant-images')
WITH CHECK (bucket_id = 'restaurant-images'); 