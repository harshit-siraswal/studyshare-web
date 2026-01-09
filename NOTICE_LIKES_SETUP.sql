-- ============================================
-- NOTICE_LIKES_SETUP.sql
-- Add likes/upvote functionality to notices and comments
-- ============================================

-- Create notice_likes table (for liking notices)
CREATE TABLE IF NOT EXISTS notice_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    college_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_email) -- One like per user per notice
);

-- Create comment_likes table (for liking comments)
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_email) -- One like per user per comment
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notice_likes_notice_id ON notice_likes(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_likes_user_email ON notice_likes(user_email);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- Enable RLS
ALTER TABLE notice_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read-only for frontend
DROP POLICY IF EXISTS "notice_likes_read" ON notice_likes;
CREATE POLICY "notice_likes_read" ON notice_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes_read" ON comment_likes;
CREATE POLICY "comment_likes_read" ON comment_likes FOR SELECT USING (true);

-- Block writes from anon key
DROP POLICY IF EXISTS "notice_likes_deny_write" ON notice_likes;
CREATE POLICY "notice_likes_deny_write" ON notice_likes FOR ALL USING (false);

DROP POLICY IF EXISTS "comment_likes_deny_write" ON comment_likes;
CREATE POLICY "comment_likes_deny_write" ON comment_likes FOR ALL USING (false);

-- Add likes_count column to notices if not exists
ALTER TABLE notices ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Add likes_count column to notice_comments if not exists
ALTER TABLE notice_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Verification
SELECT 'notice_likes table created' AS status;
SELECT 'comment_likes table created' AS status;
