-- Create missing tables referenced in existing code
CREATE TABLE IF NOT EXISTS public.simple_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  receive_notifications BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  author_name TEXT,
  author_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

-- Add missing column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS author_id TEXT;

-- Create basic policies
CREATE POLICY "Anyone can view venue ratings" ON public.venue_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can create venue ratings" ON public.venue_ratings FOR INSERT WITH CHECK (true);

-- Simple member policies
CREATE POLICY "Simple members can view their own data" ON public.simple_members FOR SELECT USING (true);
CREATE POLICY "Simple members can create accounts" ON public.simple_members FOR INSERT WITH CHECK (true);

-- Admin policies for blocked users
CREATE POLICY "Anyone can view blocked users" ON public.blocked_users FOR SELECT USING (true);
CREATE POLICY "Anyone can create blocked users" ON public.blocked_users FOR INSERT WITH CHECK (true);

-- Create triggers for timestamp updates
CREATE TRIGGER update_simple_members_updated_at
  BEFORE UPDATE ON public.simple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin policies for venues
CREATE POLICY "Admins can manage all venues" ON public.venues FOR ALL USING (true);