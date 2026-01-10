-- ========================================
-- CHATROOM_SCHEMA_RESET.sql
-- Complete reset of chat room schema
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Add join_code column if not exists
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS join_code TEXT;

-- 2. Drop password column if exists (no longer used)
ALTER TABLE chat_rooms DROP COLUMN IF EXISTS password;

-- 3. Create index for join_code lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_join_code ON chat_rooms(join_code);

-- 4. Generate codes for ALL existing rooms that don't have one
UPDATE chat_rooms 
SET join_code = upper(substr(md5(random()::text), 1, 6))
WHERE join_code IS NULL;

-- 5. Verify the schema
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_rooms'
ORDER BY ordinal_position;

-- 6. Show all rooms with their codes
SELECT 
    id, 
    name, 
    is_private, 
    join_code, 
    member_count, 
    created_by
FROM chat_rooms
ORDER BY created_at DESC;
