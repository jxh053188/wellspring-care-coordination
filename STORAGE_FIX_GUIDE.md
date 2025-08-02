# Storage RLS Policy Fix Guide

## Problem
Your Supabase storage bucket `message-attachments` doesn't have proper Row Level Security (RLS) policies, which is causing the "new row violates row-level security policy" error when trying to upload files.

## Solution Options

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `STORAGE_RLS_FIX.sql` 
4. Click **Run** to execute the SQL

### Option 2: Alternative Simple Upload Policy

If the above doesn't work, try this simpler approach in the Supabase SQL Editor:

```sql
-- Create a simpler upload policy that allows any authenticated user to upload
CREATE POLICY "Allow authenticated uploads to message-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads from message-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');
```

### Option 3: Temporary Fix for Testing

You can temporarily disable RLS on the storage bucket to test if uploads work:

```sql
-- TEMPORARY: Make bucket public for testing (NOT for production)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'message-attachments';
```

**Important**: Re-enable privacy after testing:

```sql
-- Re-enable privacy
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message-attachments';
```

## What the Code Does

The upload code in your Messages component correctly:
1. Uses `auth.uid()` as the folder prefix (required for RLS)
2. Authenticates the user before upload
3. Creates the file path as `{userId}/{timestamp}-{filename}`

The issue is purely on the storage policy side, not in your TypeScript code.

## Verification

After applying the fix, you can verify the policies exist:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%message-attachments%';
```
