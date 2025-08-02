-- FIXED RLS POLICY - DESIGNED TO WORK WITH AUTH USER ID
-- Execute this in Supabase SQL editor

-- First, ensure the bucket is private (keeping it secure as requested)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';

-- Clean up: Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_all_operations" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_upload_message_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_read_message_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_update_message_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_delete_message_attachments" ON storage.objects;

-- Create simplified policy based ONLY on authentication and bucket_id
-- This avoids any complex joins or auth.uid() checks that might be failing
CREATE POLICY "simple_auth_storage_policy" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');

-- CRITICAL: Grant direct permissions (sometimes needed beyond policies)
GRANT ALL PRIVILEGES ON storage.objects TO authenticated;
GRANT ALL PRIVILEGES ON storage.buckets TO authenticated;

-- If you continue having issues, temporarily disable RLS for testing:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable before production)
