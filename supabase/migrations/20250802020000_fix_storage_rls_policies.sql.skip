-- Fix storage RLS policies for message-attachments bucket
-- This migration properly sets up RLS policies for file uploads

-- Ensure the message-attachments bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies to start fresh
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_download" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;

-- Enable row level security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for uploads - allow authenticated users to upload to their own folder
CREATE POLICY "authenticated_upload" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create RLS policy for downloads - allow authenticated users to download any file in the bucket
-- This allows team members to download attachments from each other
CREATE POLICY "authenticated_download" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'message-attachments'
);

-- Create RLS policy for updating objects - only allow updates to user's own files
CREATE POLICY "authenticated_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create RLS policy for deleting objects - only allow deletion of user's own files
CREATE POLICY "authenticated_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Alternative: If the above doesn't work, we can use a more permissive policy for now
-- Uncomment these if the strict policies above cause issues:

/*
-- More permissive upload policy (allows any authenticated user to upload anywhere in the bucket)
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'message-attachments');
*/
