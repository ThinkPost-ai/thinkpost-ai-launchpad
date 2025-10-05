-- Add explicit policies to prevent anonymous access to OAuth state tables

-- For instagram_oauth_states table
-- First, let's ensure the table denies all access by default (RLS is enabled)
-- Add explicit policy to deny all anonymous access
CREATE POLICY "Deny all anonymous access to instagram oauth states"
ON public.instagram_oauth_states
FOR ALL
TO anon
USING (false);

-- For tiktok_oauth_states table  
-- Add explicit policy to deny all anonymous access
CREATE POLICY "Deny all anonymous access to tiktok oauth states"
ON public.tiktok_oauth_states
FOR ALL
TO anon
USING (false);

-- Add comment explaining the security measure
COMMENT ON TABLE public.instagram_oauth_states IS 'OAuth state values for Instagram authentication. Access restricted to authenticated users and service role only.';
COMMENT ON TABLE public.tiktok_oauth_states IS 'OAuth state values for TikTok authentication. Access restricted to authenticated users only.';