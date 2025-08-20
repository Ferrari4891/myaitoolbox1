-- Fix function search path mutable warning by setting search_path for existing functions
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_admin_user() SET search_path = 'public';
ALTER FUNCTION public.set_admin_by_email(text) SET search_path = 'public';
ALTER FUNCTION public.update_venue_rating_aggregates() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.is_user_admin(uuid) SET search_path = 'public';