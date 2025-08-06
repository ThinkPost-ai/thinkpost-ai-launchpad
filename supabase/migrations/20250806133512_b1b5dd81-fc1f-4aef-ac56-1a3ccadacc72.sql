-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to process scheduled posts every minute
SELECT cron.schedule(
  'process-scheduled-posts',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://eztbwukcnddtvcairvpz.supabase.co/functions/v1/process-scheduled-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGJ3dWtjbmRkdHZjYWlydnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzM3ODAsImV4cCI6MjA2NDI0OTc4MH0.LbbYUDrZmSMTyIcZ8M9RKY-5mNnETdA6VDQI3wxyzAQ"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);