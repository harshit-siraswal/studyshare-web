## MyStudySpace RAG Implementation Guide (Owner Tasks)

This guide lists the steps you should do on your side to finalize the RAG feature end‑to‑end.

### 1) Run SQL in Supabase (order matters)
1. Ensure your **multi-college setup** is already applied (from `MULTI_COLLEGE_SETUP.sql`).
2. Run **new RAG schema** in the Supabase SQL editor:
   - `AI_RAG_SETUP.sql`
3. Run **Phase-1 AI outputs schema**:
   - `AI_PHASE1_SETUP.sql`
4. Re-run **unified RLS** (to include the new RAG tables):
   - `UNIFIED_RLS.sql`

Notes:
- `AI_RAG_SETUP.sql` enables `pgvector` with `CREATE EXTENSION IF NOT EXISTS vector;`.
  If you are not using `pgvector`, it is still safe to keep installed.
- RLS on RAG tables is set to **deny all**. Your backend must use **service_role**.

### 2) Storage + Access
1. Confirm all PDFs used for AI chat are accessible to the backend service:
   - `resources.file_url` must be valid and reachable by the ingestion worker.
2. If you want private files, create a **signed URL** workflow in backend and store
   `rag_files.file_url` as the signed URL (or store `file_path` and sign on demand).

### 3) Environment Variables (backend + worker)
Set these where your ingestion worker runs:
- `SARVAM_API_KEY`
- `SARVAM_OCR_ENDPOINT`
- `RAG_DATA_DIR` (only if using FAISS files; choose any writable folder, e.g. `/var/lib/mystudyspace/rag_data`)

If you run LLM generation from backend:
- `GEMINI_API_KEY` or your chosen LLM key

Render deployment:
- Add the same variables in Render → Your Service → **Environment**.
- Do NOT hardcode keys in code or commit them to git.

### 4) Ingestion Worker Deployment
1. Run the ingestion worker when a PDF is uploaded.
2. The worker should:
   - Create a row in `rag_files`
   - Extract/OCR → chunk → embed
   - Insert `rag_chunks`
   - Update `rag_files.status = 'indexed'`
3. If using FAISS (file‑based), keep the FAISS index **per college** in `RAG_DATA_DIR`.

Alternative (backend-only, no Python worker):
- Use `POST /api/rag/ingest` with `resource_id` (admin/moderator only).
- This uses server-side PDF extraction + chunking and stores chunks for FTS retrieval.

### 5) Chat API Integration
1. Use the new backend endpoint:
   - `POST /api/rag/query`
   - Accepts `{ question, top_k, min_score, college_id? }`
2. Retrieval logic:
   - Filter by `college_id`
   - If no results or score < threshold, return:
     `No resource found in MyStudySpace; answer below is from the web.`
3. Store outputs in:
   - `rag_query_cache` (for repeated queries)
   - `rag_query_logs` (for evaluation)

### 5b) Phase‑1 AI (Summary / Quiz / Flashcards)
Backend endpoints:
- `POST /api/ai/summary`
- `POST /api/ai/quiz`
- `POST /api/ai/flashcards`

Request body:
```
{ "file_id": "resource_id" }
```

Video support:
- If a resource is a YouTube video (`type = 'video'` + `video_url`), the backend will try to fetch captions/transcript.
- If no transcript is available, AI output will fail for that video.

### 6) Backfill Existing PDFs
If you already have resources:
1. Select all existing resources with `file_url`
2. Enqueue each for ingestion
3. Verify `rag_files` and `rag_chunks` counts per college

### 7) Verification Checklist
- `rag_files` has rows after ingestion
- `rag_chunks` count > 0 for each ingested file
- `rag_query_logs` records queries
- Chat responses contain **file + page** citations
- “No local resource” branch works when no chunks are found

### 8) Cleanup (already done in this repo)
Old frontend chatbot UI/hook removed:
- `src/components/ai/*`
- `src/hooks/useAIChat.ts`
- `src/pages/Study.tsx` AI chat usage removed

Old backend AI endpoints removed:
- `/api/ai/*` (SSE chat, questions, notice search)

If you also have old backend AI endpoints, remove or rename them to avoid conflicts.
