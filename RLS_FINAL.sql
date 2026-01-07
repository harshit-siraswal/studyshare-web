-- ============================================
-- COMPLETE RLS FIX - ALL IN ONE
-- Just run this entire file, it handles everything
-- ============================================

-- STEP 1: DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_all" ON resources;
DROP POLICY IF EXISTS "Public read resources" ON resources;
DROP POLICY IF EXISTS "Deny anon writes on resources" ON resources;
DROP POLICY IF EXISTS "Deny anon updates on resources" ON resources;
DROP POLICY IF EXISTS "Deny anon deletes on resources" ON resources;
DROP POLICY IF EXISTS "Allow resource inserts" ON resources;
DROP POLICY IF EXISTS "Block resource updates from client" ON resources;
DROP POLICY IF EXISTS "Block resource deletes from client" ON resources;

DROP POLICY IF EXISTS "syllabus_select" ON syllabus;
DROP POLICY IF EXISTS "syllabus_insert" ON syllabus;
DROP POLICY IF EXISTS "syllabus_insert_auth" ON syllabus;
DROP POLICY IF EXISTS "syllabus_read" ON syllabus;

DROP POLICY IF EXISTS "colleges_select" ON colleges;
DROP POLICY IF EXISTS "colleges_read" ON colleges;

DROP POLICY IF EXISTS "notices_select" ON notices;
DROP POLICY IF EXISTS "notices_read" ON notices;

DROP POLICY IF EXISTS "users_select" ON users;

DROP POLICY IF EXISTS "bookmarks_all" ON bookmarks;
DROP POLICY IF EXISTS "Allow bookmark select" ON bookmarks;
DROP POLICY IF EXISTS "Allow bookmark insert" ON bookmarks;
DROP POLICY IF EXISTS "Allow bookmark delete" ON bookmarks;
DROP POLICY IF EXISTS "No anon access to bookmarks" ON bookmarks;

DROP POLICY IF EXISTS "follows_all" ON follows;
DROP POLICY IF EXISTS "Allow follows select" ON follows;
DROP POLICY IF EXISTS "Allow follows insert" ON follows;
DROP POLICY IF EXISTS "No anon access to follows" ON follows;

DROP POLICY IF EXISTS "follow_requests_all" ON follow_requests;
DROP POLICY IF EXISTS "Allow follow_requests select" ON follow_requests;
DROP POLICY IF EXISTS "Allow follow_requests insert" ON follow_requests;
DROP POLICY IF EXISTS "No anon access to follow_requests" ON follow_requests;

DROP POLICY IF EXISTS "notifications_all" ON notifications;

DROP POLICY IF EXISTS "chat_rooms_all" ON chat_rooms;
DROP POLICY IF EXISTS "room_messages_all" ON room_messages;
DROP POLICY IF EXISTS "room_members_all" ON room_members;
DROP POLICY IF EXISTS "saved_posts_all" ON saved_posts;
DROP POLICY IF EXISTS "room_post_comments_all" ON room_post_comments;
DROP POLICY IF EXISTS "department_followers_all" ON department_followers;

DROP POLICY IF EXISTS "admin_keys_deny" ON admin_keys;
DROP POLICY IF EXISTS "admin_keys_no_access" ON admin_keys;
DROP POLICY IF EXISTS "admin_keys_block_all" ON admin_keys;

DROP POLICY IF EXISTS "user_roles_deny" ON user_roles;
DROP POLICY IF EXISTS "user_roles_no_access" ON user_roles;
DROP POLICY IF EXISTS "user_roles_block_all" ON user_roles;

DROP POLICY IF EXISTS "audit_log_deny" ON audit_log;
DROP POLICY IF EXISTS "audit_log_no_access" ON audit_log;
DROP POLICY IF EXISTS "audit_log_block_all" ON audit_log;

DROP POLICY IF EXISTS "activity_logs_deny" ON activity_logs;
DROP POLICY IF EXISTS "No anon access to activity_logs" ON activity_logs;

DROP POLICY IF EXISTS "users_backup_deny" ON users_backup;
DROP POLICY IF EXISTS "users_backup_no_access" ON users_backup;
DROP POLICY IF EXISTS "users_backup_block_all" ON users_backup;

-- STEP 2: Fix audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, user_email, record_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME, TG_OP, 'system',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Create new policies
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

-- ADMIN_KEYS (blocked)
ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_keys_deny" ON admin_keys FOR ALL USING (false);

-- USER_ROLES (blocked)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_deny" ON user_roles FOR ALL USING (false);

-- AUDIT_LOG (blocked - trigger uses SECURITY DEFINER)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_deny" ON audit_log FOR ALL USING (false);

-- ACTIVITY_LOGS (blocked)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_deny" ON activity_logs FOR ALL USING (false);

-- USERS_BACKUP (blocked)
ALTER TABLE users_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_backup_deny" ON users_backup FOR ALL USING (false);

-- VERIFY
SELECT 'RLS SETUP COMPLETE! Test upload now.' as status;
