-- MULTI_COLLEGE_SETUP.sql
-- Run this in Supabase SQL Editor to set up multi-college data isolation
-- Per Policy Document: All data must be linked to college_id

-- ========================================
-- 1. ADD MISSING COLUMNS TO COLLEGES TABLE
-- ========================================
-- Add a code column for easy reference (since id is UUID)
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ========================================
-- 2. ADD COLLEGES
-- ========================================
-- KIET Group of Institutions
INSERT INTO colleges (id, name, domain, code)
VALUES (gen_random_uuid(), 'KIET Group of Institutions', 'kiet.edu', 'kiet')
ON CONFLICT (domain) DO UPDATE SET code = 'kiet';

-- IIIT Bhagalpur
INSERT INTO colleges (id, name, domain, code)
VALUES (gen_random_uuid(), 'Indian Institute of Information Technology Bhagalpur', 'iiitbh.ac.in', 'iiitbh')
ON CONFLICT (domain) DO UPDATE SET code = 'iiitbh';

-- ========================================
-- 3. ADD college_id TO EXISTING TABLES (using domain instead of code)
-- ========================================

-- Add college_id to resources (if not exists) - using domain for clearer identification
ALTER TABLE resources ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to follow_requests (if not exists)
ALTER TABLE follow_requests ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to notifications (if not exists)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to chat_rooms (if not exists)
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to room_members (if not exists)
ALTER TABLE room_members ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to notices (if not exists)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- Add college_id to follows (if not exists)
ALTER TABLE follows ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet.edu';

-- ========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_resources_college_id ON resources(college_id);
CREATE INDEX IF NOT EXISTS idx_notifications_college_id ON notifications(college_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_college_id ON chat_rooms(college_id);
CREATE INDEX IF NOT EXISTS idx_notices_college_id ON notices(college_id);
CREATE INDEX IF NOT EXISTS idx_follows_college_id ON follows(college_id);

-- ========================================
-- 5. UPDATE EXISTING DATA (set default college)
-- ========================================
UPDATE resources SET college_id = 'kiet.edu' WHERE college_id IS NULL OR college_id = 'all' OR college_id = 'kiet';
UPDATE notifications SET college_id = 'kiet.edu' WHERE college_id IS NULL OR college_id = 'kiet';
UPDATE chat_rooms SET college_id = 'kiet.edu' WHERE college_id IS NULL OR college_id = 'kiet';
UPDATE notices SET college_id = 'kiet.edu' WHERE college_id IS NULL OR college_id = 'kiet';
UPDATE follows SET college_id = 'kiet.edu' WHERE college_id IS NULL OR college_id = 'kiet';

-- ========================================
-- VERIFICATION
-- ========================================
-- Run these to verify the migration:
-- SELECT * FROM colleges;
-- SELECT COUNT(*) FROM resources WHERE college_id IS NOT NULL;
