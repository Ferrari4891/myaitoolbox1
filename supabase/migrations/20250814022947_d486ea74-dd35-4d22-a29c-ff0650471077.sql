-- Create the trigger to automatically send welcome emails when profiles are created
CREATE OR REPLACE TRIGGER send_welcome_email_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Update Tony Cook's profile with proper name data
UPDATE public.profiles 
SET 
  first_name = 'Tony',
  last_name = 'Cook',
  display_name = 'Tony Cook'
WHERE email = 'tonycook396@gmail.com';