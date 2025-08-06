-- Temporarily disable RLS to test if that's the core issue
-- This is for debugging only - we'll re-enable it once we understand the problem

-- Disable RLS temporarily
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Create a simple test function to check auth context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', auth.uid(),
    'current_role', current_setting('role', true),
    'session_user', session_user,
    'current_user', current_user
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_auth_context() TO authenticated, anon;

-- Also grant full permissions temporarily for debugging
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO anon; 