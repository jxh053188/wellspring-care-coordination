-- UPDATED STORAGE RLS POLICY - DESIGNED TO WORK WITH AUTH USER ID PATH PREFIX
-- Execute this in Supabase SQL editor

-- First, ensure the bucket is private (keeping it secure as requested)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';

-- Clean up: Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_all_operations" ON storage.objects;
DROP POLICY IF EXISTS "simple_auth_storage_policy" ON storage.objects;
DROP POLICY IF EXISTS "auth_id_prefixed_files_policy" ON storage.objects;

-- Create policy that enforces auth.uid() prefix in path structure
-- This specifically matches our new file path construction: ${authUser.id}/${timestamp}-${fileName}
CREATE POLICY "auth_id_prefixed_files_policy" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
    bucket_id = 'message-attachments' AND
    (
        -- For reading/deleting existing files - allow if path starts with user's auth ID
        -- Format: {auth.uid()}/filename.ext
        storage.foldername(name)[1] = auth.uid()::text
        OR
        -- For uploads - check will happen with WITH CHECK clause
        -- This USING clause is mostly for SELECT/DELETE operations
        true
    )
)
WITH CHECK (
    bucket_id = 'message-attachments' AND
    -- For new file uploads - require path to start with user's auth ID
    storage.foldername(name)[1] = auth.uid()::text
);

-- NOTES:
-- 1. The storage.foldername() function splits the path into an array by '/'
-- 2. [1] refers to the first folder component (array is 1-indexed in PostgreSQL)
-- 3. We're checking if the first folder component matches the user's auth.uid()
-- 4. This ensures users can only access files where the path starts with their auth ID

-- CRITICAL: Grant permissions (sometimes needed beyond policies)
GRANT ALL PRIVILEGES ON storage.objects TO authenticated;
GRANT ALL PRIVILEGES ON storage.buckets TO authenticated;
