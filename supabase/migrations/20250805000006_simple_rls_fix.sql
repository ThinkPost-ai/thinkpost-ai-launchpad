-- Simple RLS fix for products table
-- Focus on the core issue without complex debugging

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can select their own products" ON public.products;
DROP POLICY IF EXISTS "Service role has full access" ON public.products;

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create simple, clear policies
CREATE POLICY "Products: Users can insert their own" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Products: Users can view their own" 
ON public.products 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Products: Users can update their own" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Products: Users can delete their own" 
ON public.products 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role; 