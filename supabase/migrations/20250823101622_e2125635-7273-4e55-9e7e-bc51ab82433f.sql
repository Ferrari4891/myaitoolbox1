-- Fix schema mismatches to align with existing code

-- Add missing columns to simple_members table
ALTER TABLE public.simple_members 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update venues table to include business_name (alias for name)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Copy name to business_name for existing records
UPDATE public.venues SET business_name = name WHERE business_name IS NULL;

-- Add missing columns to group_invitations table
ALTER TABLE public.group_invitations 
ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS custom_message TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS creator_id UUID,
ADD COLUMN IF NOT EXISTS venue_id UUID,
ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- Create missing invitation_rsvps table
CREATE TABLE IF NOT EXISTS public.invitation_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  response TEXT CHECK (response IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 0,
  response_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for new table
ALTER TABLE public.invitation_rsvps ENABLE ROW LEVEL SECURITY;

-- Create basic policies for invitation_rsvps
CREATE POLICY "Anyone can view invitation rsvps" ON public.invitation_rsvps FOR SELECT USING (true);
CREATE POLICY "Anyone can create invitation rsvps" ON public.invitation_rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invitation rsvps" ON public.invitation_rsvps FOR UPDATE USING (true);