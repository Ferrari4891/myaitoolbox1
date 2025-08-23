-- Add admin management policies for cuisine types
DROP POLICY IF EXISTS "Anyone can view active cuisine types" ON public.cuisine_types;
DROP POLICY IF EXISTS "Admins can manage cuisine types" ON public.cuisine_types;

-- Create new policies
CREATE POLICY "Anyone can view cuisine types"
ON public.cuisine_types
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cuisine types"
ON public.cuisine_types
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);