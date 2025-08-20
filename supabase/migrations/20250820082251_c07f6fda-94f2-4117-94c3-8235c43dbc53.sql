-- Fix the update_updated_at_column function search path
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';