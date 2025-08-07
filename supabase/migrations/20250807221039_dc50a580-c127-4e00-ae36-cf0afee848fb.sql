-- Drop the existing function first
DROP FUNCTION IF EXISTS public.delete_user_and_data(uuid);

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

-- Create the corrected delete function with proper parameter name
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