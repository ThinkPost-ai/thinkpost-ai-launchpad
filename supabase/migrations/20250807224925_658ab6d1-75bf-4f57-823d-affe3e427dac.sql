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
BEGIN
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
$function$;