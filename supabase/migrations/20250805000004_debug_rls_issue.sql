-- Debug and fix RLS issues for products table
-- Ensure all necessary policies are in place

-- Check if users can properly access their profiles (needed for RLS context)
-- This is important because RLS uses auth.uid() which depends on proper session

-- Make sure the products table has proper permissions
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO anon;

-- Refresh the RLS policy for product insertion to ensure it's working correctly
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;

CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also ensure the select policy exists for debugging
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;

CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

-- Enable RLS on products table (should already be enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY; 