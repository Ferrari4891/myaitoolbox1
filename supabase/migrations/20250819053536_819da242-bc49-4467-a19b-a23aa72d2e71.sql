-- Add RLS policy to allow admins to view all RSVP responses
CREATE POLICY "Admins can view all RSVP responses" 
ON public.invitation_rsvps 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));