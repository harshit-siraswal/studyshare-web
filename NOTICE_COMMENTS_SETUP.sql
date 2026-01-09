-- ============================================
-- NOTICE_COMMENTS_SETUP.sql
-- Add comments functionality to notices
-- 
-- FIXES:
-- - Uses TEXT for notice_id (matches notices.id type)
-- - Adds college_id for multi-tenant isolation
-- ============================================

-- Create notice_comments table
CREATE TABLE IF NOT EXISTS notice_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT NOT NULL,  -- TEXT to match notices.id type
    college_id TEXT NOT NULL, -- For multi-tenant isolation
    user_email TEXT NOT NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notice_comments_notice_id ON notice_comments(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_comments_college_id ON notice_comments(college_id);
CREATE INDEX IF NOT EXISTS idx_notice_comments_user_email ON notice_comments(user_email);

-- Enable RLS
ALTER TABLE notice_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read-only for frontend (consistent with other tables)
-- All writes go through backend service role
DROP POLICY IF EXISTS "notice_comments_read" ON notice_comments;
CREATE POLICY "notice_comments_read" ON notice_comments FOR SELECT USING (true);

-- Block all direct writes from anon key
DROP POLICY IF EXISTS "notice_comments_deny_insert" ON notice_comments;
CREATE POLICY "notice_comments_deny_insert" ON notice_comments FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "notice_comments_deny_update" ON notice_comments;
CREATE POLICY "notice_comments_deny_update" ON notice_comments FOR UPDATE USING (false);

DROP POLICY IF EXISTS "notice_comments_deny_delete" ON notice_comments;
CREATE POLICY "notice_comments_deny_delete" ON notice_comments FOR DELETE USING (false);

-- Verification
SELECT 'notice_comments table created successfully' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notice_comments';
