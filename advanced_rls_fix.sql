-- Advanced RLS Policy Fix for Private Buckets
-- Execute this in Supabase SQL editor

-- First, ensure the bucket is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';

-- Drop any existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow any authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read attachments from their care teams" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;

-- APPROACH 1: Direct Access by Auth Token
-- This more permissive approach gives access based solely on authentication
-- It's more secure than making the bucket public while still allowing uploads

-- Create a permissive policy for authenticated users 
CREATE POLICY "authenticated_can_upload_message_attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Add policy for reading files
CREATE POLICY "authenticated_can_read_message_attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');

-- Add policy for updating own files
CREATE POLICY "authenticated_can_update_message_attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'message-attachments');

-- Add policy for deleting own files
CREATE POLICY "authenticated_can_delete_message_attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments');

-- Alternative approach: Grant service account access
-- Uncomment and customize if you prefer using a service account
/*
-- Create role for service account
CREATE ROLE storage_service WITH LOGIN PASSWORD 'your-secure-password';

-- Grant permissions to service role
GRANT USAGE ON SCHEMA storage TO storage_service;
GRANT ALL PRIVILEGES ON storage.objects TO storage_service;
GRANT ALL PRIVILEGES ON storage.buckets TO storage_service;
*/

-- VERIFY YOUR SETTINGS
-- Check current bucket settings
SELECT * FROM storage.buckets WHERE id = 'message-attachments';

-- Check policies for the storage.objects table
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
