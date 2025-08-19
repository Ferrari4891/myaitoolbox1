-- Add RLS policy to allow authenticated users to view all profiles for member selection
CREATE POLICY "Authenticated users can view all profiles for invitations" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);