-- ============================================
-- BANNED_USERS_TABLE.sql  
-- Create banned_users table for admin ban feature
-- Run in Supabase SQL Editor
-- ============================================

-- Create banned_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    reason TEXT DEFAULT 'Banned by admin',
    college_id TEXT DEFAULT NULL,  -- NULL = global ban, otherwise college-specific
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one ban per email per college (or global)
    UNIQUE(email, college_id)
);

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "banned_users_service_role" ON banned_users;
DROP POLICY IF EXISTS "banned_users_deny_anon" ON banned_users;

-- Only service_role (backend) can access this table
-- Anon users should NOT be able to see who is banned
CREATE POLICY "banned_users_service_role" ON banned_users
    FOR ALL
    USING (current_setting('role', true) = 'service_role');

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON banned_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_college ON banned_users(college_id);

-- ============================================
-- VERIFICATION: Check table was created
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'banned_users'
ORDER BY ordinal_position;
