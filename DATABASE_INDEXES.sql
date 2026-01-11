-- ============================================
-- DATABASE_INDEXES.sql
-- Performance optimization indexes for StudySpace
-- Run in Supabase SQL Editor
-- ============================================

-- Note: Run ANALYZE after creating indexes: ANALYZE;

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

-- Composite index for common filter combination
CREATE INDEX IF NOT EXISTS idx_resources_college_semester_branch 
ON resources(college_id, semester, branch);

-- Index for uploaded_by_email (for user contributions)
CREATE INDEX IF NOT EXISTS idx_resources_uploader 
ON resources(uploaded_by_email);

-- Index for created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_resources_created 
ON resources(created_at DESC);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- Index for fetching user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_email, is_read);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_notifications_created 
ON notifications(created_at DESC);

-- ============================================
-- CHAT ROOMS / MESSAGES INDEXES
-- ============================================

-- Index for room messages by room and time
CREATE INDEX IF NOT EXISTS idx_room_messages_room 
ON room_messages(room_id, created_at DESC);

-- Index for room members lookup
CREATE INDEX IF NOT EXISTS idx_room_members_user 
ON room_members(user_email);

-- Index for room members by room
CREATE INDEX IF NOT EXISTS idx_room_members_room 
ON room_members(room_id);

-- ============================================
-- FOLLOWS / SOCIAL INDEXES
-- ============================================

-- Index for follower lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON follows(follower_email);

-- Index for following lookups
CREATE INDEX IF NOT EXISTS idx_follows_following 
ON follows(following_email);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);

-- Index for college filtering
CREATE INDEX IF NOT EXISTS idx_users_college 
ON users(college);

-- ============================================
-- BOOKMARKS INDEX
-- ============================================

-- Index for user bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user 
ON bookmarks(user_email);

-- ============================================
-- VOTES INDEXES
-- ============================================

-- Index for resource votes
CREATE INDEX IF NOT EXISTS idx_votes_resource 
ON votes(resource_id);

-- Index for user votes
CREATE INDEX IF NOT EXISTS idx_votes_user 
ON votes(user_email);

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
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
