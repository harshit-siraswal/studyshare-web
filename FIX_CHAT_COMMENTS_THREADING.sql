-- ============================================
-- FIX_CHAT_COMMENTS_THREADING.sql
-- Add parent_id to room_post_comments for threaded replies
-- ============================================

-- 1. Add parent_id to room_post_comments (missed in previous script)
ALTER TABLE room_post_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES room_post_comments(id) ON DELETE CASCADE;

-- 2. Verification
SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE column_name = 'parent_id' 
AND table_name = 'room_post_comments';
