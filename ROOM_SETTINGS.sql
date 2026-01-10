-- ========================================
-- ROOM_SETTINGS.sql
-- Add columns for room settings feature
-- Run in Supabase SQL Editor
-- ========================================

-- 1. Add notifications_muted to room_members
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS notifications_muted BOOLEAN DEFAULT false;

-- 2. Add is_banned to room_members (banned users can't post or view)
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- 3. Add banned_at timestamp
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 4. Add banned_by (admin who banned)
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS banned_by TEXT;

-- 5. Verify the schema
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'room_members'
ORDER BY ordinal_position;
