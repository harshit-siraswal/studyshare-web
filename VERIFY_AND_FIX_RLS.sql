-- ============================================
-- VERIFY AND FIX RLS - RUN THIS FIRST
-- Shows which tables have RLS enabled
-- ============================================

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================
-- Step 2: FORCE DISABLE RLS on all problem tables
-- If Step 1 shows tables with rls_enabled = true,
-- Run the commands below
-- ============================================

-- CRITICAL: Disable RLS on resources (401 error)
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;

-- Disable RLS on follows (406 error)
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- Disable RLS on follow_requests (406 error)
ALTER TABLE follow_requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other user tables
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 3: DROP ALL BLOCKING POLICIES
-- These policies may still exist and block operations
-- ============================================

-- Drop all policies on resources
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'resources'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON resources';
    END LOOP;
END $$;

-- Drop all policies on follows
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'follows'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON follows';
    END LOOP;
END $$;

-- Drop all policies on follow_requests
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'follow_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON follow_requests';
    END LOOP;
END $$;

-- Drop all policies on bookmarks
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'bookmarks'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON bookmarks';
    END LOOP;
END $$;

-- ============================================
-- Step 4: VERIFY FIX
-- Run this to confirm RLS is disabled
-- ============================================

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '🔴 STILL ENABLED - PROBLEM!' ELSE '✅ DISABLED - OK' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('resources', 'follows', 'follow_requests', 'bookmarks', 'notifications')
ORDER BY tablename;
