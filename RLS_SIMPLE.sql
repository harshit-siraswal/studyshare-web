-- ============================================
-- SIMPLIFIED RLS - ONLY CORE TABLES
-- Run this after CLEAR_ALL_POLICIES.sql
-- ============================================

-- Step 1: Fix audit trigger first
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER 
SECURITY DEFINER
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
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TIER 1: Public Read + Insert
-- ============================================

-- RESOURCES
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON resources FOR SELECT USING (true);
CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (true);

-- SYLLABUS  
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "syllabus_select" ON syllabus FOR SELECT USING (true);
CREATE POLICY "syllabus_insert" ON syllabus FOR INSERT WITH CHECK (true);

-- COLLEGES
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colleges_select" ON colleges FOR SELECT USING (true);

-- NOTICES
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_select" ON notices FOR SELECT USING (true);

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);

-- ============================================
-- TIER 2: Full Client Access
-- ============================================

-- BOOKMARKS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_all" ON bookmarks FOR ALL USING (true) WITH CHECK (true);

-- FOLLOWS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_all" ON follows FOR ALL USING (true) WITH CHECK (true);

-- FOLLOW_REQUESTS
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_requests_all" ON follow_requests FOR ALL USING (true) WITH CHECK (true);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- CHAT_ROOMS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_rooms_all" ON chat_rooms FOR ALL USING (true) WITH CHECK (true);

-- ROOM_MESSAGES
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_messages_all" ON room_messages FOR ALL USING (true) WITH CHECK (true);

-- ROOM_MEMBERS
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_members_all" ON room_members FOR ALL USING (true) WITH CHECK (true);

-- SAVED_POSTS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_posts_all" ON saved_posts FOR ALL USING (true) WITH CHECK (true);

-- ROOM_POST_COMMENTS
ALTER TABLE room_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_post_comments_all" ON room_post_comments FOR ALL USING (true) WITH CHECK (true);

-- DEPARTMENT_FOLLOWERS
ALTER TABLE department_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "department_followers_all" ON department_followers FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TIER 3: Admin Only (Block all client access)
-- ============================================

-- ADMIN_KEYS
ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_keys_deny" ON admin_keys FOR ALL USING (false);

-- USER_ROLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_deny" ON user_roles FOR ALL USING (false);

-- AUDIT_LOG
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_deny" ON audit_log FOR ALL USING (false);

-- ACTIVITY_LOGS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_deny" ON activity_logs FOR ALL USING (false);

-- USERS_BACKUP
ALTER TABLE users_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_backup_deny" ON users_backup FOR ALL USING (false);

-- ============================================
-- VERIFY
-- ============================================
SELECT tablename, rowsecurity, 
    (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
