-- AI_RAG_SETUP.sql
-- RAG storage for AI chat: files, chunks, cache, logs
-- College isolation uses TEXT college_id (per MULTI_COLLEGE_SETUP.sql)

-- Optional (pgvector). Safe to keep even if you use FAISS.
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- 1) RAG FILES (one row per ingested PDF)
-- ========================================
CREATE TABLE IF NOT EXISTS rag_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id TEXT NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('resources', 'syllabus', 'notices', 'manual')),
  source_id TEXT,
  title TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT DEFAULT 'pdf',
  subject TEXT,
  semester TEXT,
  branch TEXT,
  chapter TEXT,
  topic TEXT,
  page_count INTEGER,
  content_hash TEXT, -- sha256 of file bytes or extracted text
  ocr_confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
  uploaded_by_email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_files_college ON rag_files(college_id);
CREATE INDEX IF NOT EXISTS idx_rag_files_status ON rag_files(status);
CREATE INDEX IF NOT EXISTS idx_rag_files_source ON rag_files(source_table, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_files_source_hash
  ON rag_files(source_table, source_id, content_hash)
  WHERE source_id IS NOT NULL AND content_hash IS NOT NULL;

-- ========================================
-- 2) RAG CHUNKS
-- ========================================
CREATE TABLE IF NOT EXISTS rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES rag_files(id) ON DELETE CASCADE,
  college_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  token_count INTEGER,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(384), -- optional if you use pgvector; leave NULL if using FAISS
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_file ON rag_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_college ON rag_chunks(college_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_file_chunk ON rag_chunks(file_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_fts
  ON rag_chunks USING gin (to_tsvector('english', chunk_text));

-- Optional pgvector index (comment out if you don't use pgvector)
-- CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
--   ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- ANALYZE rag_chunks;

-- ========================================
-- 2b) FTS SEARCH FUNCTION (text-based retrieval)
-- ========================================
CREATE OR REPLACE FUNCTION rag_search_chunks(
  p_college_id TEXT,
  p_query TEXT,
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  chunk_id UUID,
  file_id UUID,
  file_title TEXT,
  page_start INT,
  page_end INT,
  chunk_text TEXT,
  rank REAL
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id AS chunk_id,
    c.file_id,
    f.title AS file_title,
    c.page_start,
    c.page_end,
    c.chunk_text,
    ts_rank_cd(to_tsvector('english', c.chunk_text), plainto_tsquery('english', p_query)) AS rank
  FROM rag_chunks c
  JOIN rag_files f ON f.id = c.file_id
  WHERE c.college_id = p_college_id
    AND to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
$$;

-- ========================================
-- 3) QUERY CACHE
-- ========================================
CREATE TABLE IF NOT EXISTS rag_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  question TEXT,
  answer TEXT NOT NULL,
  sources JSONB NOT NULL,
  no_local BOOLEAN NOT NULL DEFAULT false,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_query_cache
  ON rag_query_cache(college_id, query_hash);

-- ========================================
-- 4) QUERY LOGS (audit + evaluation)
-- ========================================
CREATE TABLE IF NOT EXISTS rag_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id TEXT NOT NULL,
  user_email TEXT,
  question TEXT NOT NULL,
  top_k INTEGER,
  min_score NUMERIC,
  retrieval_count INTEGER,
  top_score NUMERIC,
  no_local BOOLEAN,
  latency_ms INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_query_logs_college ON rag_query_logs(college_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_created ON rag_query_logs(created_at DESC);

-- ========================================
-- 5) INGESTION JOBS (optional but useful)
-- ========================================
CREATE TABLE IF NOT EXISTS rag_ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES rag_files(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_ingest_jobs_file ON rag_ingest_jobs(file_id);
CREATE INDEX IF NOT EXISTS idx_rag_ingest_jobs_status ON rag_ingest_jobs(status);

-- ========================================
-- 6) RLS (backend service_role only)
-- ========================================
ALTER TABLE rag_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_ingest_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rag_files_deny" ON rag_files;
CREATE POLICY "rag_files_deny" ON rag_files FOR ALL USING (false);

DROP POLICY IF EXISTS "rag_chunks_deny" ON rag_chunks;
CREATE POLICY "rag_chunks_deny" ON rag_chunks FOR ALL USING (false);

DROP POLICY IF EXISTS "rag_cache_deny" ON rag_query_cache;
CREATE POLICY "rag_cache_deny" ON rag_query_cache FOR ALL USING (false);

DROP POLICY IF EXISTS "rag_logs_deny" ON rag_query_logs;
CREATE POLICY "rag_logs_deny" ON rag_query_logs FOR ALL USING (false);

DROP POLICY IF EXISTS "rag_ingest_jobs_deny" ON rag_ingest_jobs;
CREATE POLICY "rag_ingest_jobs_deny" ON rag_ingest_jobs FOR ALL USING (false);
