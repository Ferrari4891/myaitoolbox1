-- Update existing profiles to pull first_name and last_name from auth user metadata
UPDATE public.profiles 
SET 
  first_name = COALESCE(auth_users.raw_user_meta_data->>'first_name', profiles.first_name),
  last_name = COALESCE(auth_users.raw_user_meta_data->>'last_name', profiles.last_name),
  display_name = COALESCE(
    auth_users.raw_user_meta_data->>'display_name',
    CASE 
      WHEN auth_users.raw_user_meta_data->>'first_name' IS NOT NULL 
           AND auth_users.raw_user_meta_data->>'last_name' IS NOT NULL
      THEN CONCAT(auth_users.raw_user_meta_data->>'first_name', ' ', auth_users.raw_user_meta_data->>'last_name')
      ELSE profiles.display_name
    END
  )
FROM auth.users AS auth_users
WHERE profiles.user_id = auth_users.id
  AND profiles.email IS NOT NULL;