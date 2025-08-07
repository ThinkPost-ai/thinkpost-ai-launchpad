-- Create a unified operation credit function that charges 1 credit per operation
-- regardless of whether both image enhancement and caption generation are used

CREATE OR REPLACE FUNCTION public.decrement_operation_credits(
  user_id uuid,
  operation_type text DEFAULT 'general'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_credits INTEGER;
  operation_id text;
BEGIN
  -- Generate a unique operation ID based on user and timestamp
  operation_id := user_id::text || '-' || extract(epoch from now())::text;
  
  -- Check if this operation has already been charged within the last 60 seconds
  -- (to prevent double charging for enhancement + caption in same operation)
  IF EXISTS (
    SELECT 1 FROM public.operation_credits_log 
    WHERE user_id = decrement_operation_credits.user_id 
    AND created_at > (now() - interval '60 seconds')
    AND operation_type = decrement_operation_credits.operation_type
  ) THEN
    -- Return current credits without charging again
    SELECT caption_credits INTO current_credits
    FROM public.profiles
    WHERE id = decrement_operation_credits.user_id;
    
    RETURN COALESCE(current_credits, 0);
  END IF;
  
  -- Get current credits and lock the row
  SELECT caption_credits INTO current_credits
  FROM public.profiles
  WHERE id = decrement_operation_credits.user_id
  FOR UPDATE;
  
  -- Check if user has credits
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Decrement credits
  UPDATE public.profiles
  SET caption_credits = caption_credits - 1
  WHERE id = decrement_operation_credits.user_id;
  
  -- Log the operation to prevent double charging
  INSERT INTO public.operation_credits_log (user_id, operation_type, credits_before, credits_after)
  VALUES (
    decrement_operation_credits.user_id,
    decrement_operation_credits.operation_type,
    current_credits,
    current_credits - 1
  );
  
  RETURN current_credits - 1;
END;
$function$

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

-- Clean up old log entries (older than 1 hour) to prevent table growth
CREATE OR REPLACE FUNCTION public.cleanup_operation_credits_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.operation_credits_log 
  WHERE created_at < (now() - interval '1 hour');
END;
$function$