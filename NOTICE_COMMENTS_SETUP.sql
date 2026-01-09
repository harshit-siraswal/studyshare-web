-- ============================================
-- NOTICE_COMMENTS_SETUP.sql
-- Add comments functionality to notices
-- ============================================

-- Create notice_comments table
CREATE TABLE IF NOT EXISTS notice_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notice_comments_notice_id ON notice_comments(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_comments_user_email ON notice_comments(user_email);

-- Enable RLS
ALTER TABLE notice_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read-only for frontend (consistent with other tables)
CREATE POLICY "notice_comments_read" ON notice_comments FOR SELECT USING (true);

-- Grant access to anon role for reads
GRANT SELECT ON notice_comments TO anon;

-- Verification
SELECT 'notice_comments table created successfully' AS status;
