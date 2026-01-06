-- BACKEND_SCHEMA.sql
-- Run this in Supabase SQL Editor to set up backend-required tables
-- These tables support the new secure backend architecture

-- ========================================
-- 1. USER ROLES TABLE
-- ========================================
-- Stores explicit role assignments (overrides domain-based detection)

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('READ_ONLY', 'COLLEGE_USER', 'MODERATOR', 'ADMIN')),
  assigned_by TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  college_id TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ========================================
-- 2. ACTIVITY LOGS TABLE
-- ========================================
-- Audit trail for all privileged actions

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ========================================
-- 3. ENHANCE FOLLOW_REQUESTS TABLE
-- ========================================
-- Add response tracking columns

ALTER TABLE follow_requests 
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_by TEXT;

-- Fix existing 'accepted' status to 'approved' (standardize)
UPDATE follow_requests 
SET status = 'approved' 
WHERE status = 'accepted';

-- Add status constraint (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_follow_request_status'
  ) THEN
    ALTER TABLE follow_requests 
      ADD CONSTRAINT check_follow_request_status 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- 4. ENSURE BOOKMARKS TABLE HAS USER_EMAIL
-- ========================================
-- The backend uses user_email, not user_id

ALTER TABLE bookmarks 
  ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_email ON bookmarks(user_email);

-- ========================================
-- 5. ADD is_approved TO RESOURCES IF MISSING
-- ========================================
ALTER TABLE resources 
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- ========================================
-- 6. RLS POLICIES FOR DEFENSE-IN-DEPTH
-- ========================================
-- These ensure that even if anon key is compromised, writes are blocked

-- Enable RLS on critical tables
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Public read for all resources (simpler policy)
DROP POLICY IF EXISTS "Public read approved resources" ON resources;
CREATE POLICY "Public read resources" ON resources
  FOR SELECT
  USING (true);

-- Deny all writes from anon key (force through backend service role)
DROP POLICY IF EXISTS "Deny anon writes on resources" ON resources;
CREATE POLICY "Deny anon writes on resources" ON resources
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anon updates on resources" ON resources;
CREATE POLICY "Deny anon updates on resources" ON resources
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Deny anon deletes on resources" ON resources;
CREATE POLICY "Deny anon deletes on resources" ON resources
  FOR DELETE
  USING (false);

-- Bookmarks: no anon access at all
DROP POLICY IF EXISTS "No anon access to bookmarks" ON bookmarks;
CREATE POLICY "No anon access to bookmarks" ON bookmarks
  FOR ALL
  USING (false);

-- Follows: no anon access at all
DROP POLICY IF EXISTS "No anon access to follows" ON follows;
CREATE POLICY "No anon access to follows" ON follows
  FOR ALL
  USING (false);

-- Follow requests: no anon access at all
DROP POLICY IF EXISTS "No anon access to follow_requests" ON follow_requests;
CREATE POLICY "No anon access to follow_requests" ON follow_requests
  FOR ALL
  USING (false);

-- Activity logs: no anon access
DROP POLICY IF EXISTS "No anon access to activity_logs" ON activity_logs;
CREATE POLICY "No anon access to activity_logs" ON activity_logs
  FOR ALL
  USING (false);

-- ========================================
-- VERIFICATION
-- ========================================
-- Run these to verify the setup:
-- SELECT * FROM user_roles LIMIT 5;
-- SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'follow_requests';
-- SELECT DISTINCT status FROM follow_requests;
