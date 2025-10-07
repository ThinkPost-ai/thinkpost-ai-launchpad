-- Allow null captions in scheduled_posts table
-- This enables scheduling posts even without captions

ALTER TABLE public.scheduled_posts 
ALTER COLUMN caption DROP NOT NULL;

-- Add a comment explaining this change
COMMENT ON COLUMN public.scheduled_posts.caption IS 'Post caption - can be empty if user has not generated one yet';

