-- Create trigger to send welcome email when new profiles are created
CREATE OR REPLACE TRIGGER send_welcome_email_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();

-- Manually send welcome email for mark ferrari
SELECT net.http_post(
    url := 'https://urczlhjnztiaxdsatueu.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY3psaGpuenRpYXhkc2F0dWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5NTIwNSwiZXhwIjoyMDY3MzcxMjA1fQ.ygF7n2a5wVhwl7IB1--aqq8hSSwzQgJEoXm_Ag3Npd0'
    ),
    body := jsonb_build_object(
      'userId', 'cd4ff47b-2f5d-4559-9042-73f496713d73',
      'email', 'smartguidebooks@gmail.com',
      'displayName', 'mark ferrari'
    )
  ) AS welcome_email_result;