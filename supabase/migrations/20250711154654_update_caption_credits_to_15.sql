-- Update all existing users to have 15 caption credits
-- This ensures existing users get the new quota of 15 credits instead of the old 8

UPDATE public.profiles 
SET caption_credits = 15 
WHERE caption_credits < 15;

-- Update the default value for new users to ensure they get 15 credits
ALTER TABLE public.profiles 
ALTER COLUMN caption_credits SET DEFAULT 15;

-- Add a comment to document the change
COMMENT ON COLUMN public.profiles.caption_credits IS 'Number of AI caption generation credits available to the user (monthly quota: 15)';
