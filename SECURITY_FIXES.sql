-- SECURITY_FIXES.sql
-- Harden RLS + view security + function search_path per linter findings
-- Run in Supabase SQL Editor

-- 0) Extensions schema and vector placement
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
  END IF;
END $$;

-- Allow access to extensions schema (adjust as needed)
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 1) View security: use SECURITY INVOKER semantics
ALTER VIEW IF EXISTS public.notice_like_counts SET (security_invoker = true);

-- 2) RLS for admin/sensitive tables
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_push_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Normalize notification_preferences to user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_preferences'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.notification_preferences ADD COLUMN user_id VARCHAR(128)';
  END IF;

  -- Backfill user_id from users.email if user_email exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_preferences'
      AND column_name = 'user_email'
  ) THEN
    EXECUTE '
      UPDATE public.notification_preferences p
      SET user_id = u.id
      FROM public.users u
      WHERE p.user_id IS NULL
        AND p.user_email IS NOT NULL
        AND u.email = p.user_email
    ';
  END IF;
END $$;

DROP POLICY IF EXISTS "admin_notifications_service_role" ON public.admin_notifications;
CREATE POLICY "admin_notifications_service_role"
  ON public.admin_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_push_history_service_role" ON public.admin_push_history;
CREATE POLICY "admin_push_history_service_role"
  ON public.admin_push_history
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "fcm_tokens_user_manage" ON public.fcm_tokens;
CREATE POLICY "fcm_tokens_user_manage"
  ON public.fcm_tokens
  FOR ALL
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notification_prefs_user_manage" ON public.notification_preferences;
CREATE POLICY "notification_prefs_user_manage"
  ON public.notification_preferences
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 3) Tables with RLS enabled but no policy (ensure policies exist)
ALTER TABLE IF EXISTS public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notice_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.premium_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_read_all" ON public.comment_likes;
CREATE POLICY "comment_likes_read_all" ON public.comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes_user_manage" ON public.comment_likes;
CREATE POLICY "comment_likes_user_manage" ON public.comment_likes
  FOR ALL
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notice_likes_read_all" ON public.notice_likes;
CREATE POLICY "notice_likes_read_all" ON public.notice_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "notice_likes_user_manage" ON public.notice_likes;
CREATE POLICY "notice_likes_user_manage" ON public.notice_likes
  FOR ALL
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "comment_reactions_read_all" ON public.comment_reactions';
  EXECUTE 'DROP POLICY IF EXISTS "comment_reactions_user_insert" ON public.comment_reactions';
  EXECUTE 'DROP POLICY IF EXISTS "comment_reactions_user_delete" ON public.comment_reactions';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comment_reactions'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "comment_reactions_read_all" ON public.comment_reactions
      FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "comment_reactions_user_insert" ON public.comment_reactions
      FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "comment_reactions_user_delete" ON public.comment_reactions
      FOR DELETE USING (user_id = auth.uid())';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comment_reactions'
      AND column_name = 'user_email'
  ) THEN
    EXECUTE 'CREATE POLICY "comment_reactions_read_all" ON public.comment_reactions
      FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "comment_reactions_user_insert" ON public.comment_reactions
      FOR INSERT WITH CHECK (user_email = auth.jwt()->>''email'')';
    EXECUTE 'CREATE POLICY "comment_reactions_user_delete" ON public.comment_reactions
      FOR DELETE USING (user_email = auth.jwt()->>''email'')';
  ELSE
    RAISE NOTICE 'comment_reactions has no user_id or user_email column; skipping policies';
  END IF;
END $$;

DROP POLICY IF EXISTS "message_votes_select" ON public.message_votes;
CREATE POLICY "message_votes_select" ON public.message_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "message_votes_insert" ON public.message_votes;
CREATE POLICY "message_votes_insert" ON public.message_votes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "message_votes_delete" ON public.message_votes;
CREATE POLICY "message_votes_delete" ON public.message_votes
  FOR DELETE USING (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notice_comments_read" ON public.notice_comments;
CREATE POLICY "notice_comments_read" ON public.notice_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "notice_comments_user_manage" ON public.notice_comments;
CREATE POLICY "notice_comments_user_manage" ON public.notice_comments
  FOR ALL
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "room_votes_user_manage" ON public.room_message_votes;
CREATE POLICY "room_votes_user_manage" ON public.room_message_votes
  FOR ALL
  USING (user_email = auth.jwt()->>'email')
  WITH CHECK (user_email = auth.jwt()->>'email');

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "payments_user_select" ON public.payments';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "payments_user_select" ON public.payments
      FOR SELECT USING (auth.uid()::text = user_id)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'user_email'
  ) THEN
    EXECUTE 'CREATE POLICY "payments_user_select" ON public.payments
      FOR SELECT USING (user_email = auth.jwt()->>''email'')';
  ELSE
    RAISE NOTICE 'payments has no user_id or user_email column; skipping policy';
  END IF;
END $$;

DROP POLICY IF EXISTS "premium_users_read_own" ON public.premium_users;
CREATE POLICY "premium_users_read_own" ON public.premium_users
  FOR SELECT USING (auth.uid() = id);

-- 4) Function search_path hardening
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'is_following', 'increment_resource_votes', 'is_resource_owner', 'rag_search_chunks',
        'join_room', 'safe_update_resource', 'secure_update_resource', 'secure_delete_resource',
        'cleanup_rate_limits', 'is_room_member', 'update_vote_counts', 'safe_post_message',
        'create_room_with_limit', 'check_rate_limit', 'notify_resource_status_change',
        'ban_user', 'send_follow_request', 'accept_follow_request', 'can_upload_syllabus',
        'generate_username_from_email', 'insert_notice', 'update_notice_visibility', 'get_user_role',
        'insert_resource', 'accept_follow_request_v2', 'cancel_follow_request', 'secure_delete_room_message',
        'prevent_ownership_change', 'get_user_room_limits', 'get_follower_count', 'delete_notice',
        'get_following_count', 'toggle_notice_active', 'get_net_votes', 'can_post_to_department',
        'get_notices', 'update_updated_at_column', 'update_room_settings', 'safe_delete_resource',
        'upsert_user_with_role', 'secure_unfollow_user', 'current_user_email', 'delete_notice_v2',
        'reject_follow_request', 'delete_expired_rooms', 'delete_room', 'determine_role_from_email',
        'secure_leave_room', 'update_updated_at_users', 'verify_admin_key', 'secure_follow_user',
        'update_prefs_updated_at', 'notify_new_follower', 'handle_resource_status_change'
      ])
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
