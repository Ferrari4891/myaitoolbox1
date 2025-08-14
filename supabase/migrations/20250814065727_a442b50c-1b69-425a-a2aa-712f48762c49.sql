-- Create a blocked_users table to prevent specific users from having profiles created
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage blocked users
CREATE POLICY "Admins can manage blocked users" 
ON public.blocked_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create or replace the handle_new_user function to check blocked users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if this email is blocked
  IF EXISTS (SELECT 1 FROM public.blocked_users WHERE email = new.email) THEN
    RAISE NOTICE 'User creation blocked for email: %', new.email;
    RETURN new; -- Don't create profile but don't fail the auth
  END IF;
  
  -- Create profile for non-blocked users
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Add Tony Cook to blocked users and delete his profile permanently
INSERT INTO public.blocked_users (email, reason) 
VALUES ('tonycook396@gmail.com', 'Removed by admin - multiple duplicate accounts')
ON CONFLICT (email) DO NOTHING;

-- Delete Tony's profile
DELETE FROM public.profiles WHERE email = 'tonycook396@gmail.com';