-- ========================================
-- ADMIN_KEYS_SETUP.sql
-- Setup admin_keys table for admin dashboard authentication
-- Run in Supabase SQL Editor
-- ========================================

-- First, check what the admin_keys table looks like
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_keys';

-- If table doesn't exist or has wrong structure, recreate it:
-- DROP TABLE IF EXISTS admin_keys CASCADE;

CREATE TABLE IF NOT EXISTS admin_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_name TEXT NOT NULL,
    email TEXT,
    key_hash TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'admin',
    department TEXT DEFAULT 'ALL',
    subject TEXT DEFAULT 'ALL',
    college_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- If table exists but is missing email column:
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS admin_name TEXT;
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS key_hash TEXT UNIQUE;
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'ALL';
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'ALL';
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS college_id TEXT;
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- ALTER TABLE admin_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "admin_keys_service_role" ON admin_keys;
CREATE POLICY "admin_keys_service_role" ON admin_keys
    FOR ALL USING (true);

-- Insert your admin key (REPLACE with actual values):
-- Get key_hash from: console.log(session.key_hash) in admin-studyspace browser console
-- 
-- INSERT INTO admin_keys (admin_name, email, key_hash, role, department, subject, college_id, is_active)
-- VALUES (
--     'Harshit Admin',
--     'harshit.25004152@gmail.com',
--     'PASTE_YOUR_KEY_HASH_HERE',
--     'super_admin',
--     'ALL',
--     'ALL',
--     'kiet.edu',
--     true
-- );

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_keys';
