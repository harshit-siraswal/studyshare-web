-- FIX_FOLLOWS_RLS.sql
-- Run this in Supabase SQL Editor to fix 406 errors on follows/follow_requests

-- DISABLE RLS temporarily to fix the 406 errors
-- The backend uses service role key which bypasses RLS anyway

-- For follows table
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- For follow_requests table  
ALTER TABLE public.follow_requests DISABLE ROW LEVEL SECURITY;

-- OR if you want to enable RLS with proper policies:

-- Re-enable RLS with permissive policies
-- ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES
-- DROP POLICY IF EXISTS "follows_select_policy" ON follows;
-- DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
-- DROP POLICY IF EXISTS "follows_delete_policy" ON follows;
-- DROP POLICY IF EXISTS "follow_requests_select_policy" ON follow_requests;
-- DROP POLICY IF EXISTS "follow_requests_insert_policy" ON follow_requests;
-- DROP POLICY IF EXISTS "follow_requests_update_policy" ON follow_requests;
-- DROP POLICY IF EXISTS "follow_requests_delete_policy" ON follow_requests;

-- CREATE PERMISSIVE POLICIES (allow all authenticated users)
-- CREATE POLICY "follows_select_policy" ON follows FOR SELECT USING (true);
-- CREATE POLICY "follows_insert_policy" ON follows FOR INSERT WITH CHECK (true);
-- CREATE POLICY "follows_delete_policy" ON follows FOR DELETE USING (true);

-- CREATE POLICY "follow_requests_select_policy" ON follow_requests FOR SELECT USING (true);
-- CREATE POLICY "follow_requests_insert_policy" ON follow_requests FOR INSERT WITH CHECK (true);
-- CREATE POLICY "follow_requests_update_policy" ON follow_requests FOR UPDATE USING (true);
-- CREATE POLICY "follow_requests_delete_policy" ON follow_requests FOR DELETE USING (true);
