-- Re-enable RLS on products table now that we've fixed the storage issue
-- The real problem was storage policies, not products table policies

-- Re-enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Restore the clean policies (should already exist from previous migration)
DROP POLICY IF EXISTS "Products: Users can insert their own" ON public.products;
DROP POLICY IF EXISTS "Products: Users can view their own" ON public.products;
DROP POLICY IF EXISTS "Products: Users can update their own" ON public.products;
DROP POLICY IF EXISTS "Products: Users can delete their own" ON public.products;

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