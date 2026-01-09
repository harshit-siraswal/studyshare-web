-- ============================================
-- FIX_NOTICE_LIKES.sql
-- Fix notice_likes table to allow backend writes
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- 1. Create notice_likes table if not exists
CREATE TABLE IF NOT EXISTS notice_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    college_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_email)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_notice_likes_notice_id ON notice_likes(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_likes_user_email ON notice_likes(user_email);

-- 3. Enable RLS
ALTER TABLE notice_likes ENABLE ROW LEVEL SECURITY;

-- 4. FIX: Remove old blocking policies
DROP POLICY IF EXISTS "notice_likes_deny_write" ON notice_likes;
DROP POLICY IF EXISTS "notice_likes_read" ON notice_likes;

-- 5. Create proper policies:
-- Allow read for all authenticated users
CREATE POLICY "notice_likes_read_all" ON notice_likes
    FOR SELECT USING (true);

-- Note: Writes are done via Supabase Admin Client in backend
-- So we don't need insert/update/delete policies for auth.jwt()

-- 6. Verification
SELECT 'notice_likes fixed!' AS status;
SELECT COUNT(*) as like_count FROM notice_likes;
