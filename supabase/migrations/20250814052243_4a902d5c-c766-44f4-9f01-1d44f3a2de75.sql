-- Add admin policy to allow admins to update event approval status
CREATE POLICY "Admins can manage all event invitations" 
ON public.group_invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);