-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email text;

-- Update the handle_new_user function to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age_group, gender, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'age_group', 
    new.raw_user_meta_data->>'gender',
    new.email
  );
  RETURN new;
END;
$$;

-- Update existing profiles with email data from auth.users
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.user_id = auth_users.id
AND profiles.email IS NULL;