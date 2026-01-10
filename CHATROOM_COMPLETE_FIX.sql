-- ========================================
-- CHATROOM_COMPLETE_FIX.sql
-- Complete fix for chatroom features
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Add join_code column if not exists
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS join_code TEXT;

-- 2. Create index for room_code lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_join_code ON chat_rooms(join_code);

-- 3. Generate join codes for existing private rooms that don't have one
UPDATE chat_rooms 
SET join_code = upper(substr(md5(random()::text), 1, 6))
WHERE is_private = true AND join_code IS NULL;

-- 4. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_rooms';

-- 5. View current rooms
SELECT id, name, is_private, join_code, member_count, created_by
FROM chat_rooms
ORDER BY created_at DESC;
