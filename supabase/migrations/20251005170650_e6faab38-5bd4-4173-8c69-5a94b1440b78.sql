-- Create secure OAuth tokens table
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Instagram tokens
  instagram_access_token text,
  instagram_user_id text,
  instagram_username text,
  instagram_avatar_url text,
  instagram_connected boolean DEFAULT false,
  
  -- Facebook tokens
  facebook_access_token text,
  facebook_page_id text,
  facebook_app_scoped_user_id text,
  
  -- TikTok tokens
  tiktok_access_token text,
  tiktok_refresh_token text,
  tiktok_open_id text,
  tiktok_username text,
  tiktok_avatar_url text,
  tiktok_token_expires_at timestamp with time zone,
  tiktok_connected boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own tokens
CREATE POLICY "Users can view their own OAuth tokens"
  ON public.user_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth tokens"
  ON public.user_oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth tokens"
  ON public.user_oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth tokens"
  ON public.user_oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Migrate existing token data from profiles to user_oauth_tokens
INSERT INTO public.user_oauth_tokens (
  user_id,
  instagram_access_token,
  instagram_user_id,
  instagram_username,
  instagram_avatar_url,
  instagram_connected,
  facebook_access_token,
  facebook_page_id,
  facebook_app_scoped_user_id,
  tiktok_access_token,
  tiktok_refresh_token,
  tiktok_open_id,
  tiktok_username,
  tiktok_avatar_url,
  tiktok_token_expires_at,
  tiktok_connected
)
SELECT 
  id,
  instagram_access_token,
  instagram_user_id,
  instagram_username,
  instagram_avatar_url,
  instagram_connected,
  facebook_access_token,
  facebook_page_id,
  facebook_app_scoped_user_id,
  tiktok_access_token,
  tiktok_refresh_token,
  tiktok_open_id,
  tiktok_username,
  tiktok_avatar_url,
  tiktok_token_expires_at,
  tiktok_connected
FROM public.profiles
WHERE instagram_access_token IS NOT NULL 
   OR facebook_access_token IS NOT NULL 
   OR tiktok_access_token IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  instagram_access_token = EXCLUDED.instagram_access_token,
  instagram_user_id = EXCLUDED.instagram_user_id,
  instagram_username = EXCLUDED.instagram_username,
  instagram_avatar_url = EXCLUDED.instagram_avatar_url,
  instagram_connected = EXCLUDED.instagram_connected,
  facebook_access_token = EXCLUDED.facebook_access_token,
  facebook_page_id = EXCLUDED.facebook_page_id,
  facebook_app_scoped_user_id = EXCLUDED.facebook_app_scoped_user_id,
  tiktok_access_token = EXCLUDED.tiktok_access_token,
  tiktok_refresh_token = EXCLUDED.tiktok_refresh_token,
  tiktok_open_id = EXCLUDED.tiktok_open_id,
  tiktok_username = EXCLUDED.tiktok_username,
  tiktok_avatar_url = EXCLUDED.tiktok_avatar_url,
  tiktok_token_expires_at = EXCLUDED.tiktok_token_expires_at,
  tiktok_connected = EXCLUDED.tiktok_connected,
  updated_at = now();

-- Remove sensitive token columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS instagram_access_token,
  DROP COLUMN IF EXISTS facebook_access_token,
  DROP COLUMN IF EXISTS tiktok_access_token,
  DROP COLUMN IF EXISTS tiktok_refresh_token;

-- Create updated_at trigger for user_oauth_tokens
CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON public.user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_user_oauth_tokens_user_id ON public.user_oauth_tokens(user_id);