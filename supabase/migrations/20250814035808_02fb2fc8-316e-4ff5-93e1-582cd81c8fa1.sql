-- Fix the foreign key constraint in group_invitations table
-- Drop the existing constraint if it exists
ALTER TABLE public.group_invitations DROP CONSTRAINT IF EXISTS fk_saved_restaurant;

-- Rename the column to be more accurate
ALTER TABLE public.group_invitations RENAME COLUMN saved_restaurant_id TO venue_id;

-- Add the correct foreign key constraint to venues table
ALTER TABLE public.group_invitations 
ADD CONSTRAINT fk_venue 
FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;