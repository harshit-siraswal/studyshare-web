-- ============================================
-- FIX: Allow Resource Uploads
-- The previous RLS blocks all INSERTs on resources
-- This fix allows inserts while keeping protective RLS
-- ============================================

-- 1. Drop the blocking INSERT policy on resources
DROP POLICY IF EXISTS "Deny anon writes on resources" ON resources;

-- 2. Allow INSERT on resources (for uploads)
CREATE POLICY "Allow resource inserts" ON resources
  FOR INSERT
  WITH CHECK (true);

-- 3. Keep UPDATE and DELETE protected (backend only)
-- These should already exist, but ensure they're there:
DROP POLICY IF EXISTS "Deny anon updates on resources" ON resources;
CREATE POLICY "Block resource updates from client" ON resources
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Deny anon deletes on resources" ON resources;
CREATE POLICY "Block resource deletes from client" ON resources
  FOR DELETE
  USING (false);

-- 4. Also fix bookmarks if needed (for bookmark feature)
DROP POLICY IF EXISTS "No anon access to bookmarks" ON bookmarks;
-- Allow SELECT and INSERT on bookmarks
CREATE POLICY "Allow bookmark select" ON bookmarks
  FOR SELECT USING (true);
CREATE POLICY "Allow bookmark insert" ON bookmarks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow bookmark delete" ON bookmarks
  FOR DELETE USING (true);

-- 5. Fix follows for reading
DROP POLICY IF EXISTS "No anon access to follows" ON follows;
CREATE POLICY "Allow follows select" ON follows
  FOR SELECT USING (true);
CREATE POLICY "Allow follows insert" ON follows
  FOR INSERT WITH CHECK (true);

-- 6. Fix follow_requests for reading
DROP POLICY IF EXISTS "No anon access to follow_requests" ON follow_requests;
CREATE POLICY "Allow follow_requests select" ON follow_requests
  FOR SELECT USING (true);
CREATE POLICY "Allow follow_requests insert" ON follow_requests
  FOR INSERT WITH CHECK (true);

-- ============================================
-- VERIFICATION - Check policies on resources
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'resources';
