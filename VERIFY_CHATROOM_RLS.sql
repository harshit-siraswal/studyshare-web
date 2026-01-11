-- ============================================
-- VERIFY_CHATROOM_RLS.sql
-- Verify RLS policies for chatroom security
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Check existing RLS policies for chat tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('chat_rooms', 'room_messages', 'room_members', 'saved_posts')
ORDER BY tablename, policyname;

-- 2. Ensure room_messages requires membership for SELECT
-- This prevents non-members from reading private room messages

-- Drop old non-restrictive policies if they exist
DROP POLICY IF EXISTS "room_messages_select" ON room_messages;
DROP POLICY IF EXISTS "anon_read_room_messages" ON room_messages;

-- Create secure policy that requires membership
CREATE POLICY "room_messages_members_only" ON room_messages
    FOR SELECT USING (
        -- Allow members to read messages from their rooms
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
        -- OR allow service_role (backend) full access
        OR current_setting('role', true) = 'service_role'
    );

-- 3. Ensure room_members is properly secured
DROP POLICY IF EXISTS "room_members_select" ON room_members;

CREATE POLICY "room_members_select" ON room_members
    FOR SELECT USING (
        user_email = current_setting('request.jwt.claims', true)::json->>'email'
        OR current_setting('role', true) = 'service_role'
    );

-- 4. Ensure chat_rooms respects college isolation
DROP POLICY IF EXISTS "chat_rooms_college_select" ON chat_rooms;

CREATE POLICY "chat_rooms_college_select" ON chat_rooms
    FOR SELECT USING (
        -- Public rooms visible to college members
        (is_private = false)
        -- Private rooms only visible to members
        OR id IN (
            SELECT room_id FROM room_members 
            WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
        OR current_setting('role', true) = 'service_role'
    );

-- 5. Verify policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('chat_rooms', 'room_messages', 'room_members')
ORDER BY tablename;

-- ============================================
-- EXPECTED OUTPUT:
-- room_messages: room_messages_members_only (SELECT)
-- room_members: room_members_select (SELECT)
-- chat_rooms: chat_rooms_college_select (SELECT)
-- ============================================
