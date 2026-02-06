-- ============================================
-- UNIFIED_RLS.sql
-- Complete RLS setup for StudySpace
-- 
-- ARCHITECTURE:
-- - Firebase Auth (NOT Supabase Auth)
-- - Frontend uses anon key (READ ONLY)
-- - Backend uses service_role (bypasses RLS)
-- - Multi-college data isolation via college_id
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES (Clean Slate)
-- ============================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- STEP 2: FIX AUDIT TRIGGER (SECURITY DEFINER)
-- Allows audit_log inserts via trigger even when RLS blocks
-- ============================================
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
    COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'system'),
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
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables if they exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        ALTER TABLE users_backup ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banned_users') THEN
        ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limit_tracking') THEN
        ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_playlists') THEN
        ALTER TABLE saved_playlists ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_votes') THEN
        ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
        ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_posts') THEN
        ALTER TABLE chat_posts ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_comments') THEN
        ALTER TABLE chat_comments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- STEP 4: TIER 1 - READ ONLY POLICIES
-- Frontend can SELECT, all writes via backend
-- ============================================

-- RESOURCES: Public read only
CREATE POLICY "resources_read" ON resources FOR SELECT USING (true);

-- SYLLABUS: Public read only
CREATE POLICY "syllabus_read" ON syllabus FOR SELECT USING (true);

-- COLLEGES: Public read only
CREATE POLICY "colleges_read" ON colleges FOR SELECT USING (true);

-- NOTICES: Public read only
CREATE POLICY "notices_read" ON notices FOR SELECT USING (true);

-- USERS: Public read only
CREATE POLICY "users_read" ON users FOR SELECT USING (true);

-- BOOKMARKS: Public read only
CREATE POLICY "bookmarks_read" ON bookmarks FOR SELECT USING (true);

-- FOLLOWS: Public read only
CREATE POLICY "follows_read" ON follows FOR SELECT USING (true);

-- FOLLOW_REQUESTS: Public read only
CREATE POLICY "follow_requests_read" ON follow_requests FOR SELECT USING (true);

-- NOTIFICATIONS: Public read only
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (true);

-- VOTES: Public read only
CREATE POLICY "votes_read" ON votes FOR SELECT USING (true);

-- CHAT_ROOMS: Public read only
CREATE POLICY "chat_rooms_read" ON chat_rooms FOR SELECT USING (true);

-- ROOM_MESSAGES: Public read only
CREATE POLICY "room_messages_read" ON room_messages FOR SELECT USING (true);

-- ROOM_MEMBERS: Public read only
CREATE POLICY "room_members_read" ON room_members FOR SELECT USING (true);

-- SAVED_POSTS: Public read only
CREATE POLICY "saved_posts_read" ON saved_posts FOR SELECT USING (true);

-- ROOM_POST_COMMENTS: Public read only
CREATE POLICY "room_post_comments_read" ON room_post_comments FOR SELECT USING (true);

-- DEPARTMENT_FOLLOWERS: Public read only
CREATE POLICY "department_followers_read" ON department_followers FOR SELECT USING (true);

-- ============================================
-- STEP 5: TIER 2 - CONDITIONAL TABLES (if exist)
-- ============================================
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_votes') THEN
        CREATE POLICY "resource_votes_read" ON resource_votes FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
        CREATE POLICY "followers_read" ON followers FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_posts') THEN
        CREATE POLICY "chat_posts_read" ON chat_posts FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_comments') THEN
        CREATE POLICY "chat_comments_read" ON chat_comments FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_playlists') THEN
        CREATE POLICY "saved_playlists_read" ON saved_playlists FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================
-- STEP 6: TIER 3 - ADMIN ONLY (Block All)
-- These tables should NEVER be accessed from frontend
-- ============================================

-- ADMIN_KEYS: Block all access
CREATE POLICY "admin_keys_deny" ON admin_keys FOR ALL USING (false);

-- USER_ROLES: Block all access
CREATE POLICY "user_roles_deny" ON user_roles FOR ALL USING (false);

-- AUDIT_LOG: Block all access (trigger uses SECURITY DEFINER)
CREATE POLICY "audit_log_deny" ON audit_log FOR ALL USING (false);

-- ACTIVITY_LOGS: Block all access
CREATE POLICY "activity_logs_deny" ON activity_logs FOR ALL USING (false);

-- USERS_BACKUP: Block all access (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        CREATE POLICY "users_backup_deny" ON users_backup FOR ALL USING (false);
    END IF;
END $$;

-- RAG TABLES: Block all access
CREATE POLICY "rag_files_deny" ON rag_files FOR ALL USING (false);
CREATE POLICY "rag_chunks_deny" ON rag_chunks FOR ALL USING (false);
CREATE POLICY "rag_cache_deny" ON rag_query_cache FOR ALL USING (false);
CREATE POLICY "rag_logs_deny" ON rag_query_logs FOR ALL USING (false);
CREATE POLICY "rag_ingest_jobs_deny" ON rag_ingest_jobs FOR ALL USING (false);
CREATE POLICY "ai_outputs_deny" ON ai_outputs FOR ALL USING (false);

-- BANNED_USERS: Block all access (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banned_users') THEN
        CREATE POLICY "banned_users_deny" ON banned_users FOR ALL USING (false);
    END IF;
END $$;

-- RATE_LIMIT_TRACKING: Block all access (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limit_tracking') THEN
        CREATE POLICY "rate_limit_tracking_deny" ON rate_limit_tracking FOR ALL USING (false);
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    t.tablename AS "Table",
    CASE WHEN t.rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS "RLS",
    COALESCE(
        (SELECT string_agg(p.policyname || ' (' || p.cmd || ')', ', ')
         FROM pg_policies p WHERE p.tablename = t.tablename),
        '⚠️ NO POLICY'
    ) AS "Policies"
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
