-- Check current default value and fix any remaining base64url references
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'group_invitations' 
AND column_name = 'invite_token';

-- Drop and recreate the column with proper encoding
ALTER TABLE public.group_invitations 
ALTER COLUMN invite_token 
SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- Also check collection_shares table for similar issue
ALTER TABLE public.collection_shares 
ALTER COLUMN share_token 
SET DEFAULT encode(gen_random_bytes(32), 'hex');