-- EMERGENCY FIX FOR RLS ISSUES WITH MESSAGE ATTACHMENTS
-- Run this in your Supabase SQL Editor

-- =====================================================================
-- OPTION 1: MAKE BUCKET PUBLIC (TEMPORARY FIX FOR DEVELOPMENT)
-- =====================================================================
-- This is the most direct fix and will immediately resolve the RLS issues
-- by making the bucket public. This bypasses RLS completely.

-- Make the bucket public (simplest solution for development)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'message-attachments';

-- NOTE: For a production environment, you would want to switch back
-- to a private bucket with proper policies before deployment.

-- =====================================================================
-- OPTION 2: DISABLE RLS COMPLETELY (TEMPORARY)
-- =====================================================================
-- If option 1 doesn't work, this will disable RLS entirely for the storage objects table

-- Disable RLS on the storage objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- OPTION 3: DIRECT BUCKET ACCESS FOR SERVICE ROLE
-- =====================================================================
-- If you want to maintain security while fixing the issue,
-- you could modify your application to use a service role for storage operations

-- 1. Create a service role in Supabase dashboard
-- 2. Update your client code to use the service role for storage operations only
-- 3. This bypasses RLS while maintaining security for other operations

-- =====================================================================
-- CHECKING CONFIGURATION
-- =====================================================================
-- Run these commands to verify your current configuration:

-- Check if the bucket exists and its settings
SELECT * FROM storage.buckets WHERE id = 'message-attachments';

-- List all policies for storage objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================================
-- RESTORE SECURITY FOR PRODUCTION
-- =====================================================================
-- After development is complete, run these to restore security:

-- 1. Make the bucket private again:
-- UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';

-- 2. Re-enable RLS if you disabled it:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Apply proper policies (see documentation)
