-- ============================================
-- FIX_ALL_LIKES_RLS.sql
-- FIX: Remove ALL blocking RLS policies on notice_likes
-- Backend uses admin client which bypasses RLS
-- Frontend only needs SELECT (read likes count)
-- ============================================

-- Drop ALL existing policies on notice_likes
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'notice_likes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notice_likes', pol.policyname);
    END LOOP;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS notice_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    college_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notice_likes_notice_id ON notice_likes(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_likes_user_email ON notice_likes(user_email);

-- Enable RLS
ALTER TABLE notice_likes ENABLE ROW LEVEL SECURITY;

-- ONLY allow SELECT for frontend (count likes, check if user liked)
CREATE POLICY "notice_likes_select_all" ON notice_likes
    FOR SELECT USING (true);

-- IMPORTANT: No INSERT/UPDATE/DELETE policies
-- Backend uses supabase admin client which BYPASSES RLS entirely
-- This is the correct pattern for write operations

-- Verification
SELECT 'All notice_likes RLS policies dropped and recreated' AS status;
SELECT COUNT(*) as current_likes FROM notice_likes;
