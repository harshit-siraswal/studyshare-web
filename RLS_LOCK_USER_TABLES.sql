-- ============================================
-- RLS UPDATE: Block Client Writes on User Tables
-- Since frontend now uses backend API for writes,
-- we can lock down direct Supabase access
-- ============================================

-- BOOKMARKS: Read allowed, writes blocked (use backend API)
DROP POLICY IF EXISTS "bookmarks_all" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_read_only" ON bookmarks;
CREATE POLICY "bookmarks_read_only" ON bookmarks FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE = blocked for anon key

-- FOLLOWS: Read allowed, writes blocked (use backend API)
DROP POLICY IF EXISTS "follows_all" ON follows;
DROP POLICY IF EXISTS "follows_read_only" ON follows;
CREATE POLICY "follows_read_only" ON follows FOR SELECT USING (true);

-- FOLLOW_REQUESTS: Read allowed, writes blocked (use backend API)
DROP POLICY IF EXISTS "follow_requests_all" ON follow_requests;
DROP POLICY IF EXISTS "follow_requests_read_only" ON follow_requests;
CREATE POLICY "follow_requests_read_only" ON follow_requests FOR SELECT USING (true);

-- NOTIFICATIONS: Keep read+write (notifications created by backend and read by frontend)
-- Already configured correctly

-- Verify the changes
SELECT 
    tablename, 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('bookmarks', 'follows', 'follow_requests')
ORDER BY tablename, policyname;
