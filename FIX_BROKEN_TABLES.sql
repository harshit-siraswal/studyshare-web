-- ============================================
-- TARGETED FIX: Only tables that are broken
-- votes, bookmarks, follows, follow_requests
-- Resources already work - don't touch them!
-- ============================================

-- VOTES - needs full access for upvoting/downvoting
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON votes TO anon, authenticated;

-- BOOKMARKS - needs full access
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
GRANT ALL ON bookmarks TO anon, authenticated;

-- FOLLOWS - needs full access  
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
GRANT ALL ON follows TO anon, authenticated;

-- FOLLOW_REQUESTS - needs full access
ALTER TABLE follow_requests DISABLE ROW LEVEL SECURITY;
GRANT ALL ON follow_requests TO anon, authenticated;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('votes', 'bookmarks', 'follows', 'follow_requests');
