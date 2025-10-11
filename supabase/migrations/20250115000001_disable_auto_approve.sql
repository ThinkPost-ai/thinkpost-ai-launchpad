-- Disable auto-approval of scheduled posts
-- Users should manually approve posts before they can be posted

-- Drop the auto-approve trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_scheduled_posts ON public.scheduled_posts;

-- Drop the auto-approve function
DROP FUNCTION IF EXISTS public.auto_approve_scheduled_posts();

-- Clear any auto-approved timestamps from existing scheduled posts
-- This ensures all pending posts require manual approval
UPDATE public.scheduled_posts 
SET approved_at = NULL 
WHERE status = 'scheduled' 
  AND approved_at IS NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN public.scheduled_posts.approved_at IS 'Timestamp when the post was manually approved by the user. Posts must be approved before they can be automatically posted.';

