-- Add explicit policy to prevent anonymous access to user_oauth_tokens table

-- Deny all anonymous access to user_oauth_tokens
CREATE POLICY "Deny all anonymous access to user oauth tokens"
ON public.user_oauth_tokens
FOR ALL
TO anon
USING (false);

-- Update comment to reflect enhanced security
COMMENT ON TABLE public.user_oauth_tokens IS 'Secure storage for OAuth tokens. Access strictly restricted to authenticated users only. Anonymous access explicitly denied.';