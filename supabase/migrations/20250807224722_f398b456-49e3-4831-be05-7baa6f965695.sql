-- Create table to track operations and prevent double charging
CREATE TABLE IF NOT EXISTS public.operation_credits_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  credits_before integer NOT NULL,
  credits_after integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the operation credits log
ALTER TABLE public.operation_credits_log ENABLE ROW LEVEL SECURITY;

-- Create policy for the operation credits log
CREATE POLICY "Users can view their own operation logs"
ON public.operation_credits_log
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_operation_credits_log_user_time 
ON public.operation_credits_log (user_id, created_at DESC);