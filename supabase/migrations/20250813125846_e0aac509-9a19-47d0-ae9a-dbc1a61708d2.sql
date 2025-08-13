-- Update the handle_new_user function to correctly extract user data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger to send welcome email when profile is created
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Get the user's email and names
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  user_first_name := COALESCE(NEW.first_name, '');
  user_last_name := COALESCE(NEW.last_name, '');
  
  -- Call the edge function asynchronously
  PERFORM net.http_post(
    url := 'https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY3psaGpuenRpYXhkc2F0dWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5NTIwNSwiZXhwIjoyMDY3MzcxMjA1fQ.ygF7n2a5wVhwl7IB1--aqq8hSSwzQgJEoXm_Ag3Npd0'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'email', user_email,
      'displayName', CASE 
        WHEN user_first_name != '' AND user_last_name != '' THEN user_first_name || ' ' || user_last_name
        ELSE COALESCE(NEW.display_name, 'New Member')
      END
    )
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS send_welcome_email_on_profile_creation ON public.profiles;
CREATE TRIGGER send_welcome_email_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Update the existing user's profile with the correct data from raw_user_meta_data
UPDATE public.profiles 
SET 
  first_name = COALESCE((
    SELECT raw_user_meta_data->>'first_name' 
    FROM auth.users 
    WHERE id = profiles.user_id
  ), ''),
  last_name = COALESCE((
    SELECT raw_user_meta_data->>'last_name' 
    FROM auth.users 
    WHERE id = profiles.user_id
  ), ''),
  display_name = COALESCE((
    SELECT raw_user_meta_data->>'display_name' 
    FROM auth.users 
    WHERE id = profiles.user_id
  ), display_name)
WHERE user_id = 'cd4ff47b-2f5d-4559-9042-73f496713d73';