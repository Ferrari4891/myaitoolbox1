-- Create or replace the trigger function to send welcome emails
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Call the edge function asynchronously (fire and forget)
  PERFORM net.http_post(
    url := 'https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'email', user_email,
      'displayName', COALESCE(NEW.display_name, 'New Member')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire when new profiles are inserted
DROP TRIGGER IF EXISTS send_welcome_email_on_signup ON public.profiles;
CREATE TRIGGER send_welcome_email_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();