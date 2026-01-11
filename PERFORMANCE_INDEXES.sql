-- ============================================
-- PERFORMANCE_INDEXES.sql
-- Enhanced indexes for load optimization
-- Run in Supabase SQL Editor AFTER DATABASE_INDEXES.sql
-- ============================================

-- ============================================
-- COMPOSITE INDEXES (Major Performance Boost)
-- These help queries that filter by multiple columns
-- ============================================

-- Resources: Common filter pattern (college + semester + branch)
CREATE INDEX IF NOT EXISTS idx_resources_college_semester_branch
ON resources(college_id, semester, branch);

-- Resources: For sorting by votes
CREATE INDEX IF NOT EXISTS idx_resources_votes
ON resources(upvotes DESC NULLS LAST);

-- Room messages: For fetching recent messages in a room
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created
ON room_messages(room_id, created_at DESC);

-- Notifications: For user + read status queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_email, read);

-- ============================================
-- PARTIAL INDEXES (Even Faster for Common Cases)
-- Only index rows that match a condition
-- ============================================

-- Resources: Only index non-deleted active resources
-- (if you have a deleted/hidden column)
-- CREATE INDEX IF NOT EXISTS idx_resources_active
-- ON resources(college_id, created_at DESC) WHERE is_deleted = false;

-- Chat rooms: Only public rooms for listing
CREATE INDEX IF NOT EXISTS idx_rooms_public
ON chat_rooms(college_id, created_at DESC) WHERE is_private = false;

-- ============================================
-- EXPRESSION INDEXES (For Text Search)
-- ============================================

-- Resources: Lower case title for case-insensitive search
CREATE INDEX IF NOT EXISTS idx_resources_title_lower
ON resources(LOWER(title));

-- ============================================
-- RUN ANALYZE TO UPDATE STATISTICS
-- ============================================
ANALYZE resources;
ANALYZE room_messages;
ANALYZE notifications;
ANALYZE chat_rooms;

-- ============================================
-- VERIFY INDEXES
-- ============================================
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
