-- ============================================
-- PROPER RLS FOR FIREBASE AUTH + SUPABASE
-- ============================================
-- 
-- ARCHITECTURE:
-- - Firebase handles user authentication
-- - Frontend uses Supabase anon key (auth.jwt() = NULL)
-- - Backend uses service_role key (bypasses all RLS)
-- - Cloudinary handles file storage
--
-- STRATEGY:
-- Since auth.jwt() doesn't work with Firebase, we use simple
-- tiered access control:
-- - Tier 1: Public read, frontend can insert
-- - Tier 2: Full client access (auth validated by Firebase)
-- - Tier 3: Admin only (service_role only)
--
-- ============================================

-- ============================================
-- STEP 1: FIX THE AUDIT TRIGGER
-- Makes it use SECURITY DEFINER to bypass RLS
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER 
SECURITY DEFINER  -- Runs as function owner, bypasses RLS!
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, user_email, record_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'anonymous'),
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if audit fails
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: CLEAR ALL EXISTING POLICIES
-- Start fresh to avoid conflicts
-- ============================================

DO $$
DECLARE
    pol record;
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOR pol IN 
            SELECT policyname FROM pg_policies WHERE tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: TIER 1 - PUBLIC READ + INSERT
-- Resources, Syllabus, Colleges, Notices, Users
-- ============================================

-- RESOURCES
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON resources 
    FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON resources 
    FOR INSERT WITH CHECK (true);
-- UPDATE/DELETE blocked (only via backend service_role)

-- SYLLABUS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'syllabus') THEN
        ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "syllabus_select" ON syllabus;
        CREATE POLICY "syllabus_select" ON syllabus FOR SELECT USING (true);
        DROP POLICY IF EXISTS "syllabus_insert" ON syllabus;
        CREATE POLICY "syllabus_insert" ON syllabus FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- COLLEGES (read only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colleges') THEN
        ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "colleges_select" ON colleges;
        CREATE POLICY "colleges_select" ON colleges FOR SELECT USING (true);
    END IF;
END $$;

-- NOTICES (read only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices') THEN
        ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "notices_select" ON notices;
        CREATE POLICY "notices_select" ON notices FOR SELECT USING (true);
    END IF;
END $$;

-- USERS (read only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "users_select" ON users;
        CREATE POLICY "users_select" ON users FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================
-- STEP 4: TIER 2 - FULL CLIENT ACCESS
-- User content tables (auth handled by Firebase)
-- ============================================

-- BOOKMARKS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
        ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "bookmarks_all" ON bookmarks;
        CREATE POLICY "bookmarks_all" ON bookmarks FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- FOLLOWS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
        ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "follows_all" ON follows;
        CREATE POLICY "follows_all" ON follows FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- FOLLOW_REQUESTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_requests') THEN
        ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "follow_requests_all" ON follow_requests;
        CREATE POLICY "follow_requests_all" ON follow_requests FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- NOTIFICATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "notifications_all" ON notifications;
        CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- RESOURCE_VOTES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_votes') THEN
        ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "resource_votes_all" ON resource_votes;
        CREATE POLICY "resource_votes_all" ON resource_votes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- CHAT_ROOMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms') THEN
        ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "chat_rooms_all" ON chat_rooms;
        CREATE POLICY "chat_rooms_all" ON chat_rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ROOM_MESSAGES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_messages') THEN
        ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "room_messages_all" ON room_messages;
        CREATE POLICY "room_messages_all" ON room_messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ROOM_MEMBERS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_members') THEN
        ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "room_members_all" ON room_members;
        CREATE POLICY "room_members_all" ON room_members FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- SAVED_POSTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_posts') THEN
        ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "saved_posts_all" ON saved_posts;
        CREATE POLICY "saved_posts_all" ON saved_posts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ROOM_POST_COMMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_post_comments') THEN
        ALTER TABLE room_post_comments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "room_post_comments_all" ON room_post_comments;
        CREATE POLICY "room_post_comments_all" ON room_post_comments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- DEPARTMENT_FOLLOWERS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_followers') THEN
        ALTER TABLE department_followers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "department_followers_all" ON department_followers;
        CREATE POLICY "department_followers_all" ON department_followers FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- STEP 5: TIER 3 - ADMIN ONLY
-- Service role only (blocks all anon key access)
-- ============================================

-- ADMIN_KEYS (CRITICAL!)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_keys') THEN
        ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "admin_keys_deny" ON admin_keys;
        CREATE POLICY "admin_keys_deny" ON admin_keys FOR ALL USING (false);
    END IF;
END $$;

-- USER_ROLES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "user_roles_deny" ON user_roles;
        CREATE POLICY "user_roles_deny" ON user_roles FOR ALL USING (false);
    END IF;
END $$;

-- AUDIT_LOG (trigger uses SECURITY DEFINER)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "audit_log_deny" ON audit_log;
        CREATE POLICY "audit_log_deny" ON audit_log FOR ALL USING (false);
    END IF;
END $$;

-- ACTIVITY_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "activity_logs_deny" ON activity_logs;
        CREATE POLICY "activity_logs_deny" ON activity_logs FOR ALL USING (false);
    END IF;
END $$;

-- USERS_BACKUP
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        ALTER TABLE users_backup ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "users_backup_deny" ON users_backup;
        CREATE POLICY "users_backup_deny" ON users_backup FOR ALL USING (false);
    END IF;
END $$;

-- VOTES (if exists as separate table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
        ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "votes_deny" ON votes;
        CREATE POLICY "votes_deny" ON votes FOR ALL USING (false);
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COALESCE(string_agg(p.policyname, ', '), 'NO POLICIES') as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
