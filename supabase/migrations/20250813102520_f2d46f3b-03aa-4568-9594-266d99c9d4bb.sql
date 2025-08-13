-- Fix security issue for remaining functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = is_admin.user_id 
        AND profiles.is_admin = true
    );
END;
$$;