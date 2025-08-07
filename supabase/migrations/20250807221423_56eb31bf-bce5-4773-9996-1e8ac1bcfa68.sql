-- Fix the get_admin_users_data function to match actual auth.users schema
CREATE OR REPLACE FUNCTION public.get_admin_users_data()
RETURNS TABLE(
  id uuid, 
  email character varying, 
  full_name text, 
  caption_credits integer, 
  tiktok_connected boolean, 
  instagram_connected boolean, 
  updated_at timestamp with time zone, 
  auth_provider text, 
  restaurant_name text, 
  category text, 
  created_at timestamp with time zone, 
  role text
)
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