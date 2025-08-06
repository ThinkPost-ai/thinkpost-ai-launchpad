-- Add missing trigger to automatically create profiles for new users
-- This trigger calls the handle_new_user function when a user is inserted into auth.users

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create profiles for any existing users who don't have them yet
INSERT INTO public.profiles (id, full_name, avatar_url, auth_provider)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  au.raw_user_meta_data->>'avatar_url',
  COALESCE(au.raw_user_meta_data->>'auth_provider', 'email')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL; 