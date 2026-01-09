-- ============================================
-- SOCIAL_FEATURES_SETUP.sql
-- Vote persistence, like counts, and RLS policies
-- ============================================

-- 1. Room Message Votes (tracks per-user votes)
CREATE TABLE IF NOT EXISTS room_message_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES room_messages(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_room_message_votes_message ON room_message_votes(message_id);
CREATE INDEX IF NOT EXISTS idx_room_message_votes_user ON room_message_votes(user_email);

-- Enable RLS
ALTER TABLE room_message_votes ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own votes
DROP POLICY IF EXISTS "room_votes_user_manage" ON room_message_votes;
CREATE POLICY "room_votes_user_manage" ON room_message_votes
    FOR ALL
    USING (user_email = auth.jwt()->>'email')
    WITH CHECK (user_email = auth.jwt()->>'email');

-- 2. RLS for Notifications (explicit user-based policy)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_user_read" ON notifications;
CREATE POLICY "notifications_user_read" ON notifications
    FOR SELECT
    USING (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "notifications_user_delete" ON notifications;
CREATE POLICY "notifications_user_delete" ON notifications
    FOR DELETE
    USING (user_email = auth.jwt()->>'email');

-- 3. RLS for notice_likes (read all, write own)
DROP POLICY IF EXISTS "notice_likes_read_all" ON notice_likes;
CREATE POLICY "notice_likes_read_all" ON notice_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "notice_likes_user_manage" ON notice_likes;
CREATE POLICY "notice_likes_user_manage" ON notice_likes
    FOR ALL 
    USING (user_email = auth.jwt()->>'email')
    WITH CHECK (user_email = auth.jwt()->>'email');

-- 4. View for aggregated notice like counts
CREATE OR REPLACE VIEW notice_like_counts AS
SELECT 
    notice_id, 
    COUNT(*) as like_count
FROM notice_likes
GROUP BY notice_id;

-- Grant access to the view
GRANT SELECT ON notice_like_counts TO authenticated;
GRANT SELECT ON notice_like_counts TO anon;

-- 5. RLS for comment_likes
DROP POLICY IF EXISTS "comment_likes_read_all" ON comment_likes;
CREATE POLICY "comment_likes_read_all" ON comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes_user_manage" ON comment_likes;
CREATE POLICY "comment_likes_user_manage" ON comment_likes
    FOR ALL 
    USING (user_email = auth.jwt()->>'email')
    WITH CHECK (user_email = auth.jwt()->>'email');

-- Verification
SELECT 'room_message_votes table created' AS status;
SELECT 'notice_like_counts view created' AS status;
SELECT 'All RLS policies applied' AS status;
