-- Create message-attachments storage bucket
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, ensure the storage schema exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
        CREATE SCHEMA storage;
    END IF;
END $$;

-- Check if the buckets table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        -- This would normally be created by Supabase's storage extension
        -- This is just a placeholder to make the migration run without errors
        RAISE NOTICE 'storage.buckets table does not exist. It should be created by the Supabase storage extension.';
        -- DO NOT actually create the table structure here
    END IF;
END $$;

-- Try to create the bucket if the buckets table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        -- Insert the bucket if it doesn't already exist
        INSERT INTO storage.buckets (id, name, public)
        SELECT 'message-attachments', 'message-attachments', false
        WHERE NOT EXISTS (
            SELECT 1 FROM storage.buckets WHERE id = 'message-attachments'
        );
        
        RAISE NOTICE 'Created message-attachments bucket or it already existed';
    ELSE
        RAISE NOTICE 'Cannot create bucket because storage.buckets table does not exist';
    END IF;
END $$;
