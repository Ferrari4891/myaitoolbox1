-- Add missing fields to venues table that existing code expects
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS facebook_link TEXT,
ADD COLUMN IF NOT EXISTS image_1_url TEXT,
ADD COLUMN IF NOT EXISTS image_2_url TEXT,
ADD COLUMN IF NOT EXISTS image_3_url TEXT,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1),
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add missing message_replies table
CREATE TABLE IF NOT EXISTS public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Create basic policies for message_replies
CREATE POLICY "Anyone can view message replies" ON public.message_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can create message replies" ON public.message_replies FOR INSERT WITH CHECK (true);

-- Add missing response_message column to invitation_rsvps
ALTER TABLE public.invitation_rsvps ADD COLUMN IF NOT EXISTS response_message TEXT;