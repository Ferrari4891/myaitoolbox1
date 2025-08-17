-- Delete the old profile for boomercatalog@gmail.com so they get a fresh created_at
DELETE FROM public.profiles 
WHERE email = 'boomercatalog@gmail.com';