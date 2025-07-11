
-- Add a new column to track if posts have been reviewed and approved for publishing
ALTER TABLE scheduled_posts 
ADD COLUMN reviewed_and_approved BOOLEAN DEFAULT FALSE;

-- Add an index for better performance when querying reviewed posts
CREATE INDEX idx_scheduled_posts_reviewed_approved 
ON scheduled_posts(reviewed_and_approved, status, scheduled_date);
