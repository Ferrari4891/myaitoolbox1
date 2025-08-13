-- Update the user's profile with the correct names
UPDATE public.profiles 
SET 
  first_name = 'Smart Guide',
  last_name = 'Books', 
  display_name = 'Smart Guide Books'
WHERE user_id = 'cd4ff47b-2f5d-4559-9042-73f496713d73';