-- INSTRUCTIONS: Copy and run this SQL in the Supabase SQL editor

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('message-attachments', 'message-attachments')
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_download" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;

-- Create upload policy (users can only upload to their own folder)
CREATE POLICY "authenticated_upload" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create download policy (users can only download from their own folder)
CREATE POLICY "authenticated_download" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create update policy (users can only update in their own folder)
CREATE POLICY "authenticated_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create delete policy (users can only delete from their own folder)
CREATE POLICY "authenticated_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable RLS on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname IN (
    'authenticated_upload',
    'authenticated_download', 
    'authenticated_update', 
    'authenticated_delete'
  );
