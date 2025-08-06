-- Fix get_total_credits function to only use caption_credits since remaining_credits doesn't exist
-- The profiles table only has caption_credits column, not remaining_credits

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
  
  -- Only use caption_credits since remaining_credits doesn't exist in the profiles table
  SELECT COALESCE(caption_credits, 0)
  INTO total_credits
  FROM public.profiles
  WHERE id = current_user_id;
  
  RETURN COALESCE(total_credits, 0);
END;
$$;

-- Drop and recreate get_admin_users_data function to fix return type
DROP FUNCTION IF EXISTS public.get_admin_users_data();

CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  caption_credits integer,
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
    p.tiktok_connected,
    p.instagram_connected,
    p.updated_at,
    p.auth_provider,
    r.name as restaurant_name,
    r.category::text as category,
    au.created_at,
    NULL::text as role  -- profiles table doesn't have role column
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.restaurants r ON p.id = r.owner_id
  ORDER BY au.created_at DESC;
END;
$$; 