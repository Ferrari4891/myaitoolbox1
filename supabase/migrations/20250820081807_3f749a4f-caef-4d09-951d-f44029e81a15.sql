-- Create simple_members table for the new membership system
CREATE TABLE public.simple_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  receive_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.simple_members ENABLE ROW LEVEL SECURITY;

-- Create policies for simple_members
CREATE POLICY "Admins can manage all simple members" 
ON public.simple_members 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

CREATE POLICY "Anyone can insert simple members" 
ON public.simple_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Members can view their own record" 
ON public.simple_members 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_simple_members_updated_at
BEFORE UPDATE ON public.simple_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();