-- Migration: Create comment reactions table (Emojis)
-- Description: Adds table for comment reactions (emojis) and enables RLS for frontend access.

-- ============================================================
-- COMMENT REACTIONS TABLE (Emoji)
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL, -- Generic ID (notice_comments or room_post_comments)
    comment_type VARCHAR(50) NOT NULL, -- 'notice' or 'post'
    user_email VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_email, emoji, comment_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_email);

-- ============================================================
-- RLS POLICIES FOR FRONTEND ACCESS
-- ============================================================

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Everyone can view reactions"
ON comment_reactions FOR SELECT
USING (true);

-- Allow insert/delete only for own reactions
CREATE POLICY "Users can add own reactions"
ON comment_reactions FOR INSERT
WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can manage own reactions"
ON comment_reactions FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');
