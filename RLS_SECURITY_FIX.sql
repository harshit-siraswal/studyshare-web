-- ============================================
-- SECURITY FIX: Enable RLS on Tables
-- IMPORTANT: This project uses FIREBASE AUTH, not Supabase Auth
-- Therefore auth.jwt() and auth.role() DO NOT WORK here
-- 
-- STRATEGY: Since we use a backend with service_role key:
-- 1. Block all client access on sensitive tables (service role bypasses RLS)
-- 2. For tables that MUST be readable by frontend, allow SELECT only
-- 3. All writes go through backend (service role)
-- ============================================

-- FIRST: Check if tables exist before applying policies
-- Run each section separately to avoid errors on non-existent tables

-- ============================================
-- SECTION 1: CRITICAL TABLES - Block ALL access
-- (Service role bypasses RLS, so backend still works)
-- ============================================

-- 1. ADMIN_KEYS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_keys' AND table_schema = 'public') THEN
        ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "admin_keys_block_all" ON public.admin_keys;
        CREATE POLICY "admin_keys_block_all" ON public.admin_keys FOR ALL USING (false);
        RAISE NOTICE 'RLS enabled on admin_keys';
    ELSE
        RAISE NOTICE 'Table admin_keys does not exist, skipping';
    END IF;
END $$;

-- 2. USER_ROLES
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "user_roles_block_all" ON public.user_roles;
        CREATE POLICY "user_roles_block_all" ON public.user_roles FOR ALL USING (false);
        RAISE NOTICE 'RLS enabled on user_roles';
    ELSE
        RAISE NOTICE 'Table user_roles does not exist, skipping';
    END IF;
END $$;

-- 3. VOTES (if this is a system table, not resource_votes)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes' AND table_schema = 'public') THEN
        ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "votes_block_all" ON public.votes;
        CREATE POLICY "votes_block_all" ON public.votes FOR ALL USING (false);
        RAISE NOTICE 'RLS enabled on votes';
    ELSE
        RAISE NOTICE 'Table votes does not exist, skipping';
    END IF;
END $$;

-- 4. AUDIT_LOG
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
        ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "audit_log_block_all" ON public.audit_log;
        CREATE POLICY "audit_log_block_all" ON public.audit_log FOR ALL USING (false);
        RAISE NOTICE 'RLS enabled on audit_log';
    ELSE
        RAISE NOTICE 'Table audit_log does not exist, skipping';
    END IF;
END $$;

-- 5. USERS_BACKUP
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup' AND table_schema = 'public') THEN
        ALTER TABLE public.users_backup ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "users_backup_block_all" ON public.users_backup;
        CREATE POLICY "users_backup_block_all" ON public.users_backup FOR ALL USING (false);
        RAISE NOTICE 'RLS enabled on users_backup';
    ELSE
        RAISE NOTICE 'Table users_backup does not exist, skipping';
    END IF;
END $$;

-- ============================================
-- SECTION 2: READ-ONLY TABLES
-- (Allow SELECT, block INSERT/UPDATE/DELETE)
-- ============================================

-- 6. COLLEGES - public reference data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colleges' AND table_schema = 'public') THEN
        ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "colleges_select" ON public.colleges;
        CREATE POLICY "colleges_select" ON public.colleges FOR SELECT USING (true);
        DROP POLICY IF EXISTS "colleges_block_insert" ON public.colleges;
        CREATE POLICY "colleges_block_insert" ON public.colleges FOR INSERT WITH CHECK (false);
        DROP POLICY IF EXISTS "colleges_block_update" ON public.colleges;
        CREATE POLICY "colleges_block_update" ON public.colleges FOR UPDATE USING (false);
        DROP POLICY IF EXISTS "colleges_block_delete" ON public.colleges;
        CREATE POLICY "colleges_block_delete" ON public.colleges FOR DELETE USING (false);
        RAISE NOTICE 'RLS enabled on colleges (read-only)';
    ELSE
        RAISE NOTICE 'Table colleges does not exist, skipping';
    END IF;
END $$;

-- 7. SYLLABUS - IMPORTANT: Keep writable for frontend uploads!
-- DON'T enable strict RLS here - it would break syllabus uploads
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'syllabus' AND table_schema = 'public') THEN
        ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
        -- Allow all reads
        DROP POLICY IF EXISTS "syllabus_select" ON public.syllabus;
        CREATE POLICY "syllabus_select" ON public.syllabus FOR SELECT USING (true);
        -- Allow all inserts (anon key can insert)
        DROP POLICY IF EXISTS "syllabus_insert" ON public.syllabus;
        CREATE POLICY "syllabus_insert" ON public.syllabus FOR INSERT WITH CHECK (true);
        -- Block updates and deletes from client
        DROP POLICY IF EXISTS "syllabus_block_update" ON public.syllabus;
        CREATE POLICY "syllabus_block_update" ON public.syllabus FOR UPDATE USING (false);
        DROP POLICY IF EXISTS "syllabus_block_delete" ON public.syllabus;
        CREATE POLICY "syllabus_block_delete" ON public.syllabus FOR DELETE USING (false);
        RAISE NOTICE 'RLS enabled on syllabus (read + insert allowed)';
    ELSE
        RAISE NOTICE 'Table syllabus does not exist, skipping';
    END IF;
END $$;

-- 8. NOTICES - Read-only for clients
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices' AND table_schema = 'public') THEN
        ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "notices_select" ON public.notices;
        CREATE POLICY "notices_select" ON public.notices FOR SELECT USING (true);
        DROP POLICY IF EXISTS "notices_block_insert" ON public.notices;
        CREATE POLICY "notices_block_insert" ON public.notices FOR INSERT WITH CHECK (false);
        DROP POLICY IF EXISTS "notices_block_update" ON public.notices;
        CREATE POLICY "notices_block_update" ON public.notices FOR UPDATE USING (false);
        DROP POLICY IF EXISTS "notices_block_delete" ON public.notices;
        CREATE POLICY "notices_block_delete" ON public.notices FOR DELETE USING (false);
        RAISE NOTICE 'RLS enabled on notices (read-only)';
    ELSE
        RAISE NOTICE 'Table notices does not exist, skipping';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_keys', 'user_roles', 'votes', 'syllabus', 
                  'notices', 'audit_log', 'colleges', 'users_backup')
ORDER BY tablename;
