-- Add status field to group_invitations for admin approval workflow
ALTER TABLE public.group_invitations 
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

-- Update existing records to have pending status
UPDATE public.group_invitations 
SET approval_status = 'pending' 
WHERE approval_status IS NULL;

-- Add check constraint for valid statuses
ALTER TABLE public.group_invitations 
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));