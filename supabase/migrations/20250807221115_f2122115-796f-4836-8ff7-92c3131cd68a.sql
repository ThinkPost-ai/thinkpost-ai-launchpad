-- Fix all remaining functions to have proper search_path for security

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

CREATE OR REPLACE FUNCTION public.auto_approve_scheduled_posts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Auto-approve TikTok posts when they are created
  IF NEW.platform = 'tiktok' AND NEW.status = 'scheduled' AND NEW.approved_at IS NULL THEN
    NEW.approved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;