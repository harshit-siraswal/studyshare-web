-- AI_PHASE1_SETUP.sql
-- Phase-1 AI outputs for Summary, Quiz, Flashcards

CREATE TABLE IF NOT EXISTS ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('summary', 'quiz', 'flashcards')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_outputs_file_type ON ai_outputs(file_id, type);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_file ON ai_outputs(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_type ON ai_outputs(type);

-- RLS: backend service role only
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_outputs_deny" ON ai_outputs;
CREATE POLICY "ai_outputs_deny" ON ai_outputs FOR ALL USING (false);
