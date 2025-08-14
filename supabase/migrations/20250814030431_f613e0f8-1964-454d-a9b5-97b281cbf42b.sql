-- Remove all triggers that depend on the welcome email function
DROP TRIGGER IF EXISTS send_welcome_email_on_signup ON public.profiles;
DROP TRIGGER IF EXISTS send_welcome_email_on_profile_creation ON public.profiles;

-- Now remove the problematic function
DROP FUNCTION IF EXISTS public.send_welcome_email_trigger() CASCADE;