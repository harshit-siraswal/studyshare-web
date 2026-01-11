-- ========================================
-- CHATROOM_VOTES.sql
-- Add upvote/downvote for chatroom posts
-- Run in Supabase SQL Editor
-- ========================================

-- Add vote columns to room_messages
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Create message_votes table to track individual votes
CREATE TABLE IF NOT EXISTS message_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES room_messages(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One vote per user per message
    UNIQUE(message_id, user_email)
);

-- Enable RLS
ALTER TABLE message_votes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_votes_message ON message_votes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_votes_user ON message_votes(user_email);
CREATE INDEX IF NOT EXISTS idx_room_messages_upvotes ON room_messages(upvotes DESC);

-- RLS Policies
DROP POLICY IF EXISTS "message_votes_select" ON message_votes;
DROP POLICY IF EXISTS "message_votes_insert" ON message_votes;
DROP POLICY IF EXISTS "message_votes_delete" ON message_votes;

-- Anyone can see votes
CREATE POLICY "message_votes_select" ON message_votes
    FOR SELECT USING (true);

-- Authenticated users can vote
CREATE POLICY "message_votes_insert" ON message_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can remove their own votes
CREATE POLICY "message_votes_delete" ON message_votes
    FOR DELETE USING (user_email = auth.jwt() ->> 'email');

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'room_messages' 
AND column_name IN ('upvotes', 'downvotes');

SELECT table_name FROM information_schema.tables 
WHERE table_name = 'message_votes';
