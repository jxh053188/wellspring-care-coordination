# Troubleshooting Supabase Storage for Message Attachments

This document outlines steps to fix issues with file uploads to private Supabase storage buckets.

## Current Issue

The app is encountering errors when trying to upload files to the `message-attachments` bucket even though the bucket exists in Supabase. The error message suggests the bucket doesn't exist, but it's actually a permission issue related to the private bucket setting.

## Changes Made

1. **Enhanced Authentication Handling**: The upload code now explicitly checks for authentication before attempting uploads.

2. **Simplified File Path Structure**: The file naming convention has been simplified to avoid potential issues with complex paths.

3. **Updated Storage Policies**: The SQL file now contains simpler, more permissive policies to help isolate whether the issue is related to policies or authentication.

## Troubleshooting Steps

### 1. Verify Bucket Configuration

1. In the Supabase dashboard, go to Storage
2. Confirm that `message-attachments` bucket exists
3. Check if it's set to private (this is correct for security)

### 2. Apply the Basic Policies

Run the SQL from `create_message_attachments_bucket.sql` in the SQL Editor of your Supabase project. This will:
- Keep the bucket private
- Add simple policies that allow any authenticated user to upload/read files

### 3. Test Uploads

Try uploading a file through the app and check:
- Browser console for detailed error messages
- Network tab in developer tools to see the request/response
- Supabase dashboard > Storage to see if files appear

### 4. Common Issues and Solutions

#### Authentication Issues

If you're getting 401 Unauthorized errors:

```
- Make sure user is logged in before upload
- Check if the auth token is included in requests
- Verify auth token hasn't expired (it should auto-refresh)
```

#### CORS Issues

If you're seeing CORS errors:

```
- Check that your Supabase project has the correct CORS configuration
- All origins should be allowed during development
```

#### Bucket Permission Issues

If uploads still fail after applying the basic policies:

```
- Try temporarily setting the bucket to public (for testing only)
- Check if the role has explicit deny policies that override your allow policies
```

## Next Steps

1. Once basic uploads are working with the permissive policies, you can switch to the more restrictive policies
2. The commented section in the SQL file contains more secure policies that restrict access based on care team membership
3. Make sure to test thoroughly after implementing more restrictive policies

## Support

If issues persist after trying these steps:
1. Check Supabase logs for specific error messages
2. Look at the Network tab in browser developer tools for request/response details
3. Try using the Supabase client directly in the browser console to test storage operations
