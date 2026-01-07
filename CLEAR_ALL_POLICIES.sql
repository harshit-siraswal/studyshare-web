-- ============================================
-- QUICK FIX: Run this first to clear all policies
-- Then run PROPER_RLS.sql again
-- ============================================

-- Drop ALL policies on ALL tables
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- Verify all policies are gone
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
