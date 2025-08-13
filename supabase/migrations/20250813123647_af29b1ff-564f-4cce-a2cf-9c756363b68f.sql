-- Update RLS policy to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- Create new policies that allow users to see their own profile and admins to see all
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.is_admin = true
));