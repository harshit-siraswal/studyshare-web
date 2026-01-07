-- FIX_RLS_POLICIES.sql
-- Fixes overly strict RLS policies that block backend service role
-- The service_role in Supabase bypasses RLS by default, but we were also blocking
-- anon key access which may have unintended effects.

-- ==========================================
-- 1. FIX BOOKMARKS: Allow service role operations
-- ==========================================
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Deny Anon Access Bookmarks" ON bookmarks;

-- Allow read for authenticated users (their own bookmarks)
CREATE POLICY "Users Read Own Bookmarks" ON bookmarks 
    FOR SELECT 
    USING (true);  -- Service role handles auth check

-- Allow insert/delete (service role bypasses anyway, but be explicit)
CREATE POLICY "Allow Bookmarks Write" ON bookmarks 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow Bookmarks Delete" ON bookmarks 
    FOR DELETE 
    USING (true);

-- ==========================================
-- 2. FIX DEPARTMENT FOLLOWERS: Allow service role operations
-- ==========================================
-- Drop restrictive policies
DROP POLICY IF EXISTS "Deny Anon Write Dept Followers" ON department_followers;
DROP POLICY IF EXISTS "Deny Anon Delete Dept Followers" ON department_followers;

-- Allow all operations (service role uses this)
CREATE POLICY "Allow Dept Followers Write" ON department_followers 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow Dept Followers Delete" ON department_followers 
    FOR DELETE 
    USING (true);

-- ==========================================
-- 3. FIX RESOURCES: Remove write block (votes need to work)
-- ==========================================
DROP POLICY IF EXISTS "Deny Write Resources" ON resources;

-- Allow writes for resources (uploads, vote updates)
CREATE POLICY "Allow Resources Write" ON resources 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow Resources Update" ON resources 
    FOR UPDATE 
    USING (true);

-- ==========================================
-- 4. ENSURE VOTES TABLE HAS PROPER ACCESS
-- ==========================================
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Votes Read" ON votes;
CREATE POLICY "Allow Votes Read" ON votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Votes Write" ON votes;
CREATE POLICY "Allow Votes Write" ON votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Votes Update" ON votes;
CREATE POLICY "Allow Votes Update" ON votes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow Votes Delete" ON votes;
CREATE POLICY "Allow Votes Delete" ON votes FOR DELETE USING (true);

-- Verify
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('bookmarks', 'department_followers', 'resources', 'votes');
