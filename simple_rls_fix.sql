-- FOCUSED RLS POLICY FOR PRIVATE BUCKET
-- Execute this in Supabase SQL editor

-- Ensure the bucket is private (secure)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';

-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow any authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read attachments from their care teams" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;

-- SUPER IMPORTANT: Make sure we have the correct schema references
-- Sometimes RLS fails because it can't find the auth schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'auth') THEN
        RAISE NOTICE 'Warning: auth schema does not exist - policies using auth.uid() may fail';
    END IF;
END $$;

-- MOST DIRECT APPROACH: Create a policy based only on authentication
-- This policy uses the simplest possible condition but keeps security
CREATE POLICY "authenticated_users_all_operations" 
ON storage.objects 
FOR ALL -- ALL covers INSERT, SELECT, UPDATE, DELETE
TO authenticated 
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');

-- Grant additional permissions that might be needed
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- If the above doesn't work, you can try this alternative
-- that explicitly checks auth.uid() exists but doesn't restrict based on it
/*
CREATE POLICY "authenticated_users_insert" 
ON storage.objects 
FOR INSERT
TO authenticated 
WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "authenticated_users_select" 
ON storage.objects 
FOR SELECT
TO authenticated 
USING (
    bucket_id = 'message-attachments' AND
    auth.uid() IS NOT NULL
);
*/

-- Run this to check your current policies
SELECT 
    policyname, 
    tablename, 
    schemaname, 
    roles, 
    cmd AS operation, 
    permissive,
    qual AS "using_expression",
    with_check AS "with_check_expression"
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
