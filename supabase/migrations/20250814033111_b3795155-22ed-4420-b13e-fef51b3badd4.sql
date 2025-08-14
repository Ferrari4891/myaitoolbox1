-- Fix the invite_token encoding issue in group_invitations table
ALTER TABLE public.group_invitations 
ALTER COLUMN invite_token 
SET DEFAULT encode(extensions.gen_random_bytes(16), 'base64');