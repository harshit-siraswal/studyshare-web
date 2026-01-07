-- ============================================
-- FIX: Allow votes table for client access
-- Votes are less sensitive - allow full access
-- ============================================

-- Enable RLS on votes if not already
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing blocking policy
DROP POLICY IF EXISTS "votes_deny" ON votes;
DROP POLICY IF EXISTS "votes_no_access" ON votes;

-- Allow full access to votes (upvoting/downvoting)
CREATE POLICY "votes_all" ON votes FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'votes';
