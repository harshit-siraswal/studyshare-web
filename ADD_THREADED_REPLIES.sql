-- ============================================
-- ADD_THREADED_REPLIES.sql
-- Add parent_id to comments and messages for threading
-- ============================================

-- 1. Add parent_id to notice_comments
ALTER TABLE notice_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES notice_comments(id) ON DELETE CASCADE;

-- 2. Add parent_id to room_messages (for threaded chat)
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES room_messages(id) ON DELETE CASCADE;

-- 3. Add thread_depth column (optional but good for limiting recursion depth in UI)
-- ALTER TABLE notice_comments ADD COLUMN IF NOT EXISTS depth INT DEFAULT 0;
-- ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS depth INT DEFAULT 0;

-- 4. Enable RLS for new columns (usually inherited, but ensuring policies cover it)
-- Note: Existing policies usually cover all columns unless specified otherwise.

-- 5. Verification
SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE column_name = 'parent_id' 
AND table_name IN ('notice_comments', 'room_messages');
