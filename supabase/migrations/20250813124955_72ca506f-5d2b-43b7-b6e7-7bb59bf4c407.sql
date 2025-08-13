-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Update the handle_new_user function to store first and last names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age_group, gender, email, first_name, last_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'age_group', 
    new.raw_user_meta_data->>'gender',
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$;