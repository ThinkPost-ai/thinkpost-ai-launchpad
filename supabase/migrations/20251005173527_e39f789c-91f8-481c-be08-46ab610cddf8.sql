-- Remove OAuth token columns from profiles table for security
-- These tokens are now stored in the secure user_oauth_tokens table

ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS instagram_access_token,
DROP COLUMN IF EXISTS facebook_access_token,
DROP COLUMN IF EXISTS tiktok_access_token,
DROP COLUMN IF EXISTS tiktok_refresh_token;

-- Add comment explaining the change
COMMENT ON TABLE public.user_oauth_tokens IS 'Secure storage for OAuth tokens. Never expose these tokens through public APIs or functions.';