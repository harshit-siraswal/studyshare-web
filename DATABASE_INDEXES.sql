-- ============================================
-- DATABASE_INDEXES.sql
-- Performance optimization indexes for StudySpace
-- Run in Supabase SQL Editor
-- ============================================

-- This version uses DO blocks to safely create indexes
-- only if the columns exist, preventing errors

-- ============================================
-- RESOURCES TABLE INDEXES
-- ============================================

-- Index for filtering by college
CREATE INDEX IF NOT EXISTS idx_resources_college 
ON resources(college_id);

-- Index for filtering by semester
CREATE INDEX IF NOT EXISTS idx_resources_semester 
ON resources(semester);

-- Index for filtering by branch
CREATE INDEX IF NOT EXISTS idx_resources_branch 
ON resources(branch);

-- Index for uploaded_by_email (for user contributions)
CREATE INDEX IF NOT EXISTS idx_resources_uploader 
ON resources(uploaded_by_email);

-- Index for created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_resources_created 
ON resources(created_at DESC);

-- ============================================
-- CHAT ROOMS / MESSAGES INDEXES
-- ============================================

-- Index for room messages by room and time
CREATE INDEX IF NOT EXISTS idx_room_messages_room 
ON room_messages(room_id, created_at DESC);

-- Index for room members by room
CREATE INDEX IF NOT EXISTS idx_room_members_room 
ON room_members(room_id);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for username lookups (if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'username') THEN
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    END IF;
END $$;

-- Index for college filtering (if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'college') THEN
        CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
    END IF;
END $$;

-- ============================================
-- VOTES INDEXES (if table exists)
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'votes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'votes' AND column_name = 'resource_id') THEN
            CREATE INDEX IF NOT EXISTS idx_votes_resource ON votes(resource_id);
        END IF;
    END IF;
END $$;

-- ============================================
-- Run ANALYZE to update statistics
-- ============================================
ANALYZE;

-- ============================================
-- Verify indexes were created
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
