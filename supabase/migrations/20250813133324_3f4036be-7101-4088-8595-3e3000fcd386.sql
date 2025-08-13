-- Create trigger to send welcome email when new profiles are created
CREATE OR REPLACE TRIGGER send_welcome_email_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();