-- Create the message-attachments bucket
-- Execute this in Supabase SQL editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'message-attachments', 'message-attachments', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'message-attachments'
);

-- IMPORTANT: For an existing bucket, run:
-- UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- CRITICAL STEP: First ensure RLS is enabled but with a policy that allows all operations
-- This will override any default restrictive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow any authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read attachments from their care teams" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;

-- Create a single comprehensive policy that allows all operations
CREATE POLICY "Allow all operations on message-attachments" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');

-- MORE RESTRICTIVE POLICY APPROACH - IMPLEMENT ONLY AFTER BASIC FUNCTIONALITY WORKS
-- ==================================================================================
-- WARNING: Do NOT uncomment and run this section until the simple policy above
-- is confirmed working! This will replace the simple policy with more restrictive ones.
-- ==================================================================================

/*
-- STEP 1: First drop the simple policy
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;

-- STEP 2: Create specific policies for each operation

-- Allow uploads for any authenticated user
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'message-attachments');

-- Allow users to read attachments from their care teams
CREATE POLICY "Allow users to read care team attachments" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
        SELECT 1 FROM care_team_members ctm
        JOIN messages m ON ctm.care_team_id = m.care_team_id
        WHERE ctm.user_id = auth.uid()
        AND position(m.id::text in name) > 0
    )
);

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own attachments" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'message-attachments' AND
    auth.uid() IN (
        SELECT p.user_id FROM messages m
        JOIN message_attachments ma ON m.id = ma.message_id
        JOIN profiles p ON ma.uploaded_by = p.id
        WHERE position(m.id::text in name) > 0
    )
);
*/

-- ADDITIONAL TROUBLESHOOTING
-- If still encountering RLS errors, consider temporarily disabling RLS for development:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- NOTE: Re-enable before deploying to production!
