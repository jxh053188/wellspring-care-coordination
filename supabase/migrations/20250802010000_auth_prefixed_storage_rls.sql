-- auth_prefixed_storage_rls.sql
-- This file sets up proper RLS policies for the message-attachments bucket
-- using auth.uid() as the path prefix for proper authentication

-- NOTE: This file should be executed in the Supabase SQL editor directly
-- as it uses PostgreSQL-specific syntax that may not be compatible with
-- all SQL engines

/*
-- Run these commands in the Supabase SQL editor:

-- Step 1: Ensure the message-attachments bucket exists
INSERT INTO storage.buckets (id, name)
VALUES ('message-attachments', 'message-attachments')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Remove any existing policies from the bucket to start fresh
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_download" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
*/

/*
-- Step 3: Create RLS policy for uploads - only allow uploads to user's own folder
CREATE POLICY "authenticated_upload" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create RLS policy for downloads - allow access to authenticated users
CREATE POLICY "authenticated_download" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Create RLS policy for updating objects - only allow updates to user's own folder
CREATE POLICY "authenticated_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 6: Create RLS policy for deleting objects - only allow deletion of user's own folder
CREATE POLICY "authenticated_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable row level security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
*/
