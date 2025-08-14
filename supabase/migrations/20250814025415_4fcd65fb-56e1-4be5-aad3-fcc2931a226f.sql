-- Remove the problematic trigger that's blocking signups
DROP TRIGGER IF EXISTS send_welcome_email_on_profile_creation ON public.profiles;