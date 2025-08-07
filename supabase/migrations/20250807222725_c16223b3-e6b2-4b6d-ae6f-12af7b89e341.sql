-- Create RLS policy to allow admins to update any user's profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);