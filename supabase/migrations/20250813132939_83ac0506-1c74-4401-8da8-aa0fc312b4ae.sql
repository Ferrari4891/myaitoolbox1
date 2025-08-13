-- Fix the profile data for mark ferrari
UPDATE public.profiles 
SET 
  first_name = 'mark',
  last_name = 'ferrari', 
  display_name = 'mark ferrari'
WHERE email = 'smartguidebooks@gmail.com';