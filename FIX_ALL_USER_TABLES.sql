-- ============================================
-- COMBINED FIX: All User Tables RLS
-- Run this to fix votes, bookmarks, follows, etc.
-- ============================================

-- VOTES: Full access (for upvoting)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_deny" ON votes;
DROP POLICY IF EXISTS "votes_no_access" ON votes;
DROP POLICY IF EXISTS "votes_all" ON votes;
CREATE POLICY "votes_all" ON votes FOR ALL USING (true) WITH CHECK (true);

-- BOOKMARKS: Read only (writes via backend)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_all" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_read_only" ON bookmarks;
CREATE POLICY "bookmarks_read_only" ON bookmarks FOR SELECT USING (true);

-- FOLLOWS: Read only (writes via backend)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_all" ON follows;
DROP POLICY IF EXISTS "follows_read_only" ON follows;
CREATE POLICY "follows_read_only" ON follows FOR SELECT USING (true);

-- FOLLOW_REQUESTS: Read only (writes via backend)
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follow_requests_all" ON follow_requests;
DROP POLICY IF EXISTS "follow_requests_read_only" ON follow_requests;
CREATE POLICY "follow_requests_read_only" ON follow_requests FOR SELECT USING (true);

-- NOTIFICATIONS: Full access (reads and mark as read)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT 
    tablename, 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('votes', 'bookmarks', 'follows', 'follow_requests', 'notifications')
ORDER BY tablename, policyname;
