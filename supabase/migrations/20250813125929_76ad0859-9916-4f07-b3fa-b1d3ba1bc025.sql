-- Update the user's profile with the correct names
UPDATE public.profiles 
SET 
  first_name = 'Smart Guide',
  last_name = 'Books', 
  display_name = 'Smart Guide Books'
WHERE user_id = 'cd4ff47b-2f5d-4559-9042-73f496713d73';

-- Manually trigger welcome email for this user since the original trigger didn't fire
SELECT net.http_post(
  'https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/send-welcome-email',
  jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY3psaGpuenRpYXhkc2F0dWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5NTIwNSwiZXhwIjoyMDY3MzcxMjA1fQ.ygF7n2a5wVhwl7IB1--aqq8hSSwzQgJEoXm_Ag3Npd0'
  ),
  jsonb_build_object(
    'userId', 'cd4ff47b-2f5d-4559-9042-73f496713d73',
    'email', 'smartguidebooks@gmail.com',
    'displayName', 'Smart Guide Books'
  )
);