-- Create system settings table for admin configuration
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access system settings
CREATE POLICY "Only admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can insert system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Insert default credit setting
INSERT INTO public.system_settings (setting_key, setting_value, description) 
VALUES ('default_caption_credits', '15', 'Default number of caption credits for new users');

-- Update updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to use system setting for default credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  default_credits integer := 15; -- fallback default
BEGIN
  -- Get default credits from system settings
  SELECT setting_value::integer INTO default_credits
  FROM public.system_settings 
  WHERE setting_key = 'default_caption_credits'
  LIMIT 1;
  
  INSERT INTO public.profiles (id, full_name, avatar_url, auth_provider, tiktok_open_id, caption_credits)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'auth_provider', 'email'),
    new.raw_user_meta_data->>'tiktok_open_id',
    COALESCE(default_credits, 15)
  );
  return new;
END;
$$;

-- Fix all existing database functions to have proper search_path for security
CREATE OR REPLACE FUNCTION public.decrement_caption_credits(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits and lock the row
  SELECT caption_credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;
  
  -- Check if user has credits
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Decrement credits
  UPDATE public.profiles
  SET caption_credits = caption_credits - 1
  WHERE id = user_id;
  
  RETURN current_credits - 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_total_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_credits integer;
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Only use caption_credits since remaining_credits doesn't exist in the profiles table
  SELECT COALESCE(caption_credits, 0)
  INTO total_credits
  FROM public.profiles
  WHERE id = current_user_id;
  
  RETURN COALESCE(total_credits, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_and_data(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete user's data in order (respecting foreign key constraints)
  DELETE FROM public.scheduled_posts WHERE user_id = user_id_to_delete;
  DELETE FROM public.tiktok_oauth_states WHERE user_id = user_id_to_delete;
  DELETE FROM public.instagram_oauth_states WHERE user_id = user_id_to_delete;
  DELETE FROM public.images WHERE user_id = user_id_to_delete;
  DELETE FROM public.products WHERE user_id = user_id_to_delete;
  DELETE FROM public.restaurants WHERE owner_id = user_id_to_delete;
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth.users (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE(id uuid, email text, full_name text, caption_credits integer, tiktok_connected boolean, instagram_connected boolean, updated_at timestamp with time zone, auth_provider text, restaurant_name text, category text, created_at timestamp with time zone, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.caption_credits,
    p.tiktok_connected,
    p.instagram_connected,
    p.updated_at,
    p.auth_provider,
    r.name as restaurant_name,
    r.category::text as category,
    au.created_at,
    p.role as role
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.restaurants r ON p.id = r.owner_id
  ORDER BY au.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.tiktok_oauth_states 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', auth.uid(),
    'current_role', current_setting('role', true),
    'session_user', session_user,
    'current_user', current_user
  );
END;
$$;