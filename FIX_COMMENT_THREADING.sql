-- ============================================
-- FIX_COMMENT_THREADING.sql
-- Production-grade fix for Reddit-style nested comments
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add parent_id to room_post_comments (chat) with index
ALTER TABLE room_post_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES room_post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_room_post_comments_parent_id 
ON room_post_comments(parent_id);

-- 2. Add parent_id to notice_comments with index
ALTER TABLE notice_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES notice_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notice_comments_parent_id 
ON notice_comments(parent_id);

-- 3. Verification query - run this after migration to check
-- SELECT id, parent_id, content FROM room_post_comments ORDER BY created_at DESC LIMIT 10;
-- SELECT id, parent_id, content FROM notice_comments ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- Expected result: Both tables have parent_id column
-- Replies will have non-null parent_id
-- Top-level comments will have NULL parent_id
-- ============================================
