-- Update the remaining function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age_group, gender)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'age_group', 
    new.raw_user_meta_data->>'gender'
  );
  RETURN new;
END;
$function$;