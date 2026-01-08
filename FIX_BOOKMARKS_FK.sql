-- Fix missing foreign key relationships for bookmarks table
-- PostgREST requires foreign keys to perform join queries
-- Error: "Could not find a relationship between 'bookmarks' and 'resources'"

-- Check current table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookmarks';

-- Add foreign key constraint from bookmarks.resource_id to resources.id
-- First check if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookmarks_resource_id_fkey'
        AND table_name = 'bookmarks'
    ) THEN
        ALTER TABLE bookmarks 
        ADD CONSTRAINT bookmarks_resource_id_fkey 
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key: bookmarks.resource_id -> resources.id';
    ELSE
        RAISE NOTICE 'Foreign key bookmarks_resource_id_fkey already exists';
    END IF;
END $$;

-- Add foreign key constraint from bookmarks.notice_id to notices.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookmarks_notice_id_fkey'
        AND table_name = 'bookmarks'
    ) THEN
        ALTER TABLE bookmarks 
        ADD CONSTRAINT bookmarks_notice_id_fkey 
        FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key: bookmarks.notice_id -> notices.id';
    ELSE
        RAISE NOTICE 'Foreign key bookmarks_notice_id_fkey already exists';
    END IF;
END $$;

-- Verify constraints were added
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'bookmarks';

-- After running this, the PostgREST cache needs to refresh
-- This happens automatically on Supabase, but may take a moment
-- You can also use: SELECT pg_notify('pgrst', 'reload config');
SELECT pg_notify('pgrst', 'reload schema');
