-- Migration: Create comment reactions table (Emojis)
-- Description: Adds table for comment reactions (emojis) and enables RLS for frontend access.
-- Updated: Replaced user_email with user_id (UUID) for referential integrity and to avoid storing PII.

-- ============================================================
-- COMMENT REACTIONS TABLE (Emoji)
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL, -- Generic ID (notice_comments or room_post_comments)
    comment_type VARCHAR(10) NOT NULL CHECK (comment_type IN ('notice', 'post')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id, emoji, comment_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

-- ============================================================
-- RLS POLICIES FOR FRONTEND ACCESS
-- ============================================================

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Everyone can view reactions"
ON comment_reactions FOR SELECT
USING (true);

-- Allow insert only for own reactions (using auth.uid() for user_id comparison)
CREATE POLICY "Users can insert own reactions"
ON comment_reactions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow delete only for own reactions
CREATE POLICY "Users can delete own reactions"
ON comment_reactions FOR DELETE
USING (user_id = auth.uid());

-- ============================================================
-- MIGRATION PLAN: Backfill user_id from existing user_email
-- ============================================================
-- If migrating from an existing table with user_email, RUN THESE STEPS IN ORDER:

-- Step 1: Add user_id column (nullable initially)
-- ALTER TABLE comment_reactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Backfill user_id from user_email (matching users)
-- UPDATE comment_reactions cr
-- SET user_id = u.id
-- FROM auth.users u
-- WHERE u.email = cr.user_email;

-- Step 3: Handle orphaned rows (user_email not in auth.users)
-- Before making user_id NOT NULL, identify and handle rows that couldn't be backfilled.
-- 
-- 3a. Identify orphaned rows:
-- SELECT cr.id, cr.user_email, cr.comment_id, cr.emoji
-- FROM comment_reactions cr
-- WHERE cr.user_id IS NULL
--   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = cr.user_email);
--
-- 3b. Option A: Delete orphaned rows (if reactions from deleted users are not needed)
-- DELETE FROM comment_reactions
-- WHERE user_id IS NULL
--   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = user_email);
--
-- 3c. Option B: Back up orphaned rows first, then delete
-- CREATE TABLE comment_reactions_orphaned AS
-- SELECT * FROM comment_reactions
-- WHERE user_id IS NULL
--   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = user_email);
-- 
-- DELETE FROM comment_reactions
-- WHERE user_id IS NULL;
-- Step 4: Make user_id NOT NULL after verification (all rows should have user_id now)
-- ALTER TABLE comment_reactions ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Deduplicate before adding UNIQUE constraint
-- Before adding the unique constraint, remove duplicate rows to avoid constraint violation.
--
-- 5a. Identify duplicates:
-- SELECT comment_id, user_id, emoji, comment_type, COUNT(*), array_agg(id ORDER BY created_at)
-- FROM comment_reactions
-- GROUP BY comment_id, user_id, emoji, comment_type
-- HAVING COUNT(*) > 1;
--
-- 5b. Delete duplicates, keeping the oldest reaction (lowest created_at):
-- DELETE FROM comment_reactions
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (
--       PARTITION BY comment_id, user_id, emoji, comment_type
--       ORDER BY created_at ASC
--     ) as rn
--     FROM comment_reactions
--   ) sub
--   WHERE rn > 1
-- );

-- Step 6: Drop the old user_email column and related constraints/indexes
-- DROP INDEX IF EXISTS idx_comment_reactions_user;
-- ALTER TABLE comment_reactions DROP CONSTRAINT IF EXISTS comment_reactions_comment_id_user_email_emoji_comment_type_key;
-- ALTER TABLE comment_reactions DROP COLUMN user_email;

-- Step 7: Add new unique constraint and index on user_id
-- ALTER TABLE comment_reactions ADD CONSTRAINT comment_reactions_unique UNIQUE(comment_id, user_id, emoji, comment_type);
-- CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);