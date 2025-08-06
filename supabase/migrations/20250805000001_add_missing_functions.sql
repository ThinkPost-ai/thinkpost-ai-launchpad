-- Add missing database functions that the frontend expects

-- Function to get total credits for the current authenticated user (no parameters)
CREATE OR REPLACE FUNCTION public.get_total_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  SELECT COALESCE(caption_credits, 0) + COALESCE(remaining_credits, 0)
  INTO total_credits
  FROM public.profiles
  WHERE id = current_user_id;
  
  RETURN COALESCE(total_credits, 0);
END;
$$;

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_admin_users_data();

-- Function to get admin users data (used by admin dashboard)
CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  caption_credits integer,
  remaining_credits integer,
  tiktok_connected boolean,
  instagram_connected boolean,
  updated_at timestamptz,
  auth_provider text,
  restaurant_name text,
  category text,
  created_at timestamptz,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.caption_credits,
    p.remaining_credits,
    p.tiktok_connected,
    p.instagram_connected,
    p.updated_at,
    p.auth_provider,
    r.name as restaurant_name,
    r.category::text as category,
    au.created_at,
    p.role
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.restaurants r ON p.id = r.owner_id
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to delete user and all their data (used by admin)
CREATE OR REPLACE FUNCTION public.delete_user_and_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete user's data in order (respecting foreign key constraints)
  DELETE FROM public.scheduled_posts WHERE user_id = target_user_id;
  DELETE FROM public.tiktok_oauth_states WHERE user_id = target_user_id;
  DELETE FROM public.instagram_oauth_states WHERE user_id = target_user_id;
  DELETE FROM public.images WHERE user_id = target_user_id;
  DELETE FROM public.products WHERE user_id = target_user_id;
  DELETE FROM public.restaurants WHERE owner_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Set permissions for the functions
GRANT EXECUTE ON FUNCTION public.get_total_credits() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users_data() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_and_data(uuid) TO anon, authenticated, service_role; 