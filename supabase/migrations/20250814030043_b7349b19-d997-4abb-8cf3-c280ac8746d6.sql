-- Remove the problematic function that's causing the net schema error
DROP FUNCTION IF EXISTS public.send_welcome_email_trigger();