-- Remove the dangerous public SELECT policy that exposes sensitive authentication tokens
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Ensure users can still view their own profiles (this policy should already exist)
-- This is a safety measure in case the existing policy was modified
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);