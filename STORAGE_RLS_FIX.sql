-- SUPABASE STORAGE RLS FIX
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- This will fix the storage bucket RLS policies for message attachments

-- Step 1: Ensure the message-attachments bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('message-attachments', 'message-attachments', false, 52428800, ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

-- Step 2: Remove any existing conflicting policies
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_download" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in message-attachments" ON storage.objects;

-- Step 3: Create new RLS policies for the message-attachments bucket

-- Policy for uploading files - users can upload files to their own folder
CREATE POLICY "Users can upload files to message-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for viewing/downloading files - authenticated users can view any file in the bucket
-- This allows team members to download each other's attachments
CREATE POLICY "Users can view files in message-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');

-- Policy for updating files - users can only update their own files
CREATE POLICY "Users can update their own files in message-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting files - users can only delete their own files
CREATE POLICY "Users can delete their own files in message-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
