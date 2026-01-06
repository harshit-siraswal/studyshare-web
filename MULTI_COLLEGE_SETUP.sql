-- MULTI_COLLEGE_SETUP.sql
-- Run this in Supabase SQL Editor to set up multi-college data isolation
-- Per Policy Document: All data must be linked to college_id

-- ========================================
-- 1. CREATE COLLEGES TABLE (if not exists)
-- ========================================
CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. ADD COLLEGES
-- ========================================
-- KIET Group of Institutions
INSERT INTO colleges (id, name, domain, logo_url, is_active)
VALUES ('kiet', 'KIET Group of Institutions', 'kiet.edu', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- IIIT Bhagalpur
INSERT INTO colleges (id, name, domain, logo_url, is_active)
VALUES ('iiitbh', 'Indian Institute of Information Technology Bhagalpur', 'iiitbh.ac.in', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. ADD college_id TO EXISTING TABLES
-- ========================================

-- Add college_id to resources (if not exists)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to follow_requests (if not exists)
ALTER TABLE follow_requests ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to notifications (if not exists)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to chat_rooms (if not exists)
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to room_members (if not exists)
ALTER TABLE room_members ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to notices (if not exists)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

-- Add college_id to follows (if not exists)
ALTER TABLE follows ADD COLUMN IF NOT EXISTS college_id TEXT DEFAULT 'kiet';

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
UPDATE resources SET college_id = 'kiet' WHERE college_id IS NULL OR college_id = 'all';
UPDATE notifications SET college_id = 'kiet' WHERE college_id IS NULL;
UPDATE chat_rooms SET college_id = 'kiet' WHERE college_id IS NULL;
UPDATE notices SET college_id = 'kiet' WHERE college_id IS NULL;
UPDATE follows SET college_id = 'kiet' WHERE college_id IS NULL;

-- ========================================
-- VERIFICATION
-- ========================================
-- Run these to verify the migration:
-- SELECT * FROM colleges;
-- SELECT COUNT(*) FROM resources WHERE college_id IS NOT NULL;
