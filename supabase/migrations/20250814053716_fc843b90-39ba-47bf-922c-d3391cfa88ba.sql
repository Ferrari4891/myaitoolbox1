-- Fix the admin UPDATE policy and add DELETE policy for group_invitations

-- Drop the existing admin update policy 
DROP POLICY IF EXISTS "Admins can manage all event invitations" ON public.group_invitations;

-- Create proper admin UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Admins can update all event invitations" 
ON public.group_invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create admin DELETE policy
CREATE POLICY "Admins can delete all event invitations" 
ON public.group_invitations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);