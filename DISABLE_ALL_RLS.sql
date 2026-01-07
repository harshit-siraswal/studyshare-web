-- ============================================
-- NUCLEAR OPTION: DISABLE ALL RLS
-- Run this to get everything working immediately
-- ============================================

-- Disable RLS completely on all user-facing tables
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;

-- Also grant permissions just in case
GRANT ALL ON votes TO anon, authenticated;
GRANT ALL ON bookmarks TO anon, authenticated;
GRANT ALL ON follows TO anon, authenticated;
GRANT ALL ON follow_requests TO anon, authenticated;
GRANT ALL ON notifications TO anon, authenticated;
GRANT ALL ON resources TO anon, authenticated;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('votes', 'bookmarks', 'follows', 'follow_requests', 'notifications', 'resources');
