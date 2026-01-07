-- SECURE_AND_BOOKMARKS.sql
-- 1. Extend Bookmarks table for Notices
-- 2. Secure Department Followers and Bookmarks with Strict RLS

-- ==========================================
-- 1. EXTEND BOOKMARKS TABLE
-- ==========================================

-- Add notice_id column
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE CASCADE;

-- Drop existing not-null constraint on resource_id if exists/needed
ALTER TABLE bookmarks ALTER COLUMN resource_id DROP NOT NULL;

-- Add check constraint: Must have either resource_id or notice_id
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_content_check;
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_content_check 
    CHECK (
        (resource_id IS NOT NULL AND notice_id IS NULL) OR 
        (resource_id IS NULL AND notice_id IS NOT NULL)
    );

-- ==========================================
-- 2. SECURITY: DEPARTMENT FOLLOWERS
-- ==========================================

ALTER TABLE department_followers ENABLE ROW LEVEL SECURITY;

-- Allow Public Read (Frontend needs to fetch follower status/count)
DROP POLICY IF EXISTS "Public Read Dept Followers" ON department_followers;
CREATE POLICY "Public Read Dept Followers" ON department_followers 
    FOR SELECT 
    USING (true);

-- Deny All Writes (Must go through Backend API)
DROP POLICY IF EXISTS "Deny Anon Write Dept Followers" ON department_followers;
CREATE POLICY "Deny Anon Write Dept Followers" ON department_followers 
    FOR INSERT 
    WITH CHECK (false);

DROP POLICY IF EXISTS "Deny Anon Delete Dept Followers" ON department_followers;
CREATE POLICY "Deny Anon Delete Dept Followers" ON department_followers 
    FOR DELETE 
    USING (false);

-- ==========================================
-- 3. SECURITY: BOOKMARKS
-- ==========================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Deny ALL access from Frontend (Must go through Backend API)
-- Bookmarks are private user data, fetched via secure API endpoint
DROP POLICY IF EXISTS "Deny Anon Access Bookmarks" ON bookmarks;
CREATE POLICY "Deny Anon Access Bookmarks" ON bookmarks 
    FOR ALL 
    USING (false);

-- ==========================================
-- 4. CLEANUP / FIXES
-- ==========================================
-- Ensure other tables have RLS enabled as per previous PROPER_RLS plan

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
-- Public read for resources is safe
DROP POLICY IF EXISTS "Public Read Resources" ON resources;
CREATE POLICY "Public Read Resources" ON resources FOR SELECT USING (true);
-- Deny writes
DROP POLICY IF EXISTS "Deny Write Resources" ON resources;
CREATE POLICY "Deny Write Resources" ON resources FOR INSERT WITH CHECK (false);

-- Verify
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('bookmarks', 'department_followers', 'resources');
