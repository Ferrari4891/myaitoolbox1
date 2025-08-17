-- Create trigger for automatic profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if this email is blocked
  IF EXISTS (SELECT 1 FROM public.blocked_users WHERE email = new.email) THEN
    RAISE NOTICE 'User creation blocked for email: %', new.email;
    RETURN new; -- Don't create profile but don't fail the auth
  END IF;
  
  -- Create profile for non-blocked users
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(new.raw_user_meta_data->>'display_name', profiles.display_name),
    first_name = COALESCE(new.raw_user_meta_data->>'first_name', profiles.first_name),
    last_name = COALESCE(new.raw_user_meta_data->>'last_name', profiles.last_name),
    email = new.email;
    
  RETURN new;
END;
$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();