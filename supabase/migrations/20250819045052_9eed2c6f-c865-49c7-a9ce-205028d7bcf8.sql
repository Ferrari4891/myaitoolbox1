-- Add invitation type and selected members to group_invitations table
ALTER TABLE public.group_invitations 
ADD COLUMN invite_type text NOT NULL DEFAULT 'all' CHECK (invite_type IN ('all', 'select'));

ALTER TABLE public.group_invitations 
ADD COLUMN selected_member_ids jsonb DEFAULT NULL;

-- Add comment to clarify the usage
COMMENT ON COLUMN public.group_invitations.invite_type IS 'Type of invitation: all (invite all members) or select (invite specific members)';
COMMENT ON COLUMN public.group_invitations.selected_member_ids IS 'Array of user IDs when invite_type is select, null when invite_type is all';