# Fixing "Row-Level Security Policy Violation" in Supabase Storage

You're seeing the error: `StorageApiError: new row violates row-level security policy` when trying to upload attachments to messages. This error occurs because Supabase's Row-Level Security (RLS) is blocking the upload operation.

## What is RLS and Why It's Blocking Uploads

Row-Level Security is a security feature in PostgreSQL (which Supabase uses) that restricts which rows a user can access or modify. For storage, this means controlling who can upload, download, or delete files.

The error indicates that the current user doesn't have permission to insert new rows into the storage.objects table, which happens when uploading files.

## Quick Fix Options

### Option 1: Disable RLS for Development (Easiest But Least Secure)

Log into your Supabase dashboard and run this SQL in the SQL Editor:

```sql
-- DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

This completely disables security checks for the storage system.

### Option 2: Create a Permissive Policy (Better Balance)

This option maintains RLS but creates a policy that allows authenticated users to perform all operations on the message-attachments bucket:

```sql
-- First remove any conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read attachments from their care teams" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on message-attachments" ON storage.objects;

-- Create a permissive policy
CREATE POLICY "Allow all operations on message-attachments for auth users" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');
```

### Option 3: Make the Bucket Public (Not Recommended for Sensitive Data)

If you don't need to control access to files, you can make the bucket public:

```sql
UPDATE storage.buckets SET public = true WHERE id = 'message-attachments';
```

## How to Verify It's Working

After applying one of the fixes:

1. Try uploading an attachment again
2. Check the browser console for errors
3. Verify in the Supabase dashboard that:
   - The file appears in Storage > message-attachments
   - A record is created in the message_attachments table

## Proper Solution for Production

For production, you should use properly scoped RLS policies that:

1. Allow authenticated users to upload files
2. Allow users to access only files they should be able to see (e.g., from their care teams)
3. Allow users to delete only their own files

A production-ready policy setup is more complex and would be implemented after the basic functionality is working.

## Common Mistakes to Avoid

1. **Not being authenticated**: Ensure the user is logged in before uploading
2. **Policy conflicts**: Having multiple policies that conflict with each other
3. **Incorrect bucket name**: Make sure you're using 'message-attachments' consistently
4. **Case sensitivity**: Policy names and bucket IDs are case-sensitive

If you continue experiencing issues after trying these solutions, please provide the exact error message and we can provide more specific guidance.
