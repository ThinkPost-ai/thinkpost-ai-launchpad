-- Fix missing foreign key constraint for scheduled_posts.user_id
-- This constraint is essential for proper data integrity and query performance

-- First, let's check if there are any orphaned records
-- (scheduled_posts with user_id that don't exist in auth.users)
DELETE FROM public.scheduled_posts 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Add the missing foreign key constraint
ALTER TABLE public.scheduled_posts 
ADD CONSTRAINT scheduled_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id 
ON public.scheduled_posts (user_id);

-- Add a comment to document this fix
COMMENT ON CONSTRAINT scheduled_posts_user_id_fkey ON public.scheduled_posts 
IS 'Ensures scheduled_posts.user_id references valid auth.users.id';
