-- Quick Fix for Supabase Storage RLS Issues
-- =======================================
-- This SQL script provides a direct solution to Row-Level Security (RLS) issues
-- with the message-attachments bucket in Supabase.
--
-- IMPORTANT: Run this SQL in the Supabase SQL Editor
--
-- This is a DEVELOPMENT ONLY approach - for production, you should use proper RLS policies

-- OPTION 1: Temporarily disable RLS on storage.objects table
-- This is the most direct fix but reduces security
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you prefer to keep RLS enabled but allow all operations
-- First drop any conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read attachments from their care teams" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;

-- Then create a universal policy
CREATE POLICY "Allow all operations on message-attachments for authenticated users" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');

-- OPTION 3: If your message-attachments bucket isn't recognized properly
-- Make sure it exists and is configured correctly
INSERT INTO storage.buckets (id, name, public)
SELECT 'message-attachments', 'message-attachments', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'message-attachments'
);

-- Reset the bucket to private if it exists
UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- IMPORTANT: After development is complete, re-enable proper RLS by running:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- and then set up appropriate policies based on your application's needs.
