-- VISIBILITY_RLS_ANALYSIS.sql
-- Run these queries in Supabase SQL Editor to analyze whether to keep or drop idx_resources_is_approved
-- ============================================================

-- ============================================================
-- 1. DATA DISTRIBUTION ANALYSIS
-- ============================================================
-- Count approved vs unapproved resources to assess index selectivity

SELECT 
  is_approved,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM resources
GROUP BY is_approved
ORDER BY is_approved DESC;

-- Result interpretation:
-- If is_approved = true is < 20% of rows → Index on is_approved = true is BENEFICIAL
-- If is_approved = true is > 50% of rows → Index has LOW SELECTIVITY, can be dropped

-- ============================================================
-- 2. CHECK IF THE INDEX CURRENTLY EXISTS
-- ============================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'resources' 
  AND indexname IN ('idx_resources_is_approved', 'idx_resources_unapproved');

-- ============================================================
-- 3. QUERY PLAN ANALYSIS - Anonymous User (RLS: is_approved = true)
-- ============================================================
-- This simulates a logged-out user who can only see approved content
-- The RLS policy will filter to is_approved = true

-- First, check the query plan for a simple SELECT
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, title, uploaded_by_email
FROM resources
WHERE is_approved = true
LIMIT 100;

-- ============================================================
-- 4. QUERY PLAN ANALYSIS - Typical RLS-affected query
-- ============================================================
-- This shows how the planner handles the full RLS predicate

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT r.id, r.title, r.uploaded_by_email, r.is_approved
FROM resources r
WHERE 
  r.is_approved = true
  OR r.uploaded_by_email = 'test@example.com'
  OR EXISTS (
    SELECT 1 FROM follows f
    WHERE f.follower_email = 'test@example.com'
      AND f.following_email = r.uploaded_by_email
  )
LIMIT 50;

-- ============================================================
-- 5. INDEX SIZE COMPARISON
-- ============================================================
-- Check the size of existing indexes on resources table

SELECT 
  indexname,
  pg_size_pretty(pg_relation_size((schemaname || '.' || indexname)::regclass)) as size
FROM pg_indexes
WHERE tablename = 'resources'
ORDER BY pg_relation_size((schemaname || '.' || indexname)::regclass) DESC;
-- ============================================================
-- 6. RECOMMENDATION LOGIC
-- ============================================================
-- Based on the results above, use the following decision matrix:
--
-- | Approved % | Index Scan in Plan? | Recommendation                              |
-- |------------|---------------------|---------------------------------------------|
-- | < 20%      | Yes                 | KEEP or create partial index (is_approved) |
-- | < 20%      | No                  | Create partial index: WHERE is_approved    |
-- | 20-50%     | Yes                 | KEEP current index                          |
-- | 20-50%     | No                  | Consider partial index                      |
-- | > 50%      | Any                 | DROP index (low selectivity)                |
--
-- PARTIAL INDEX CREATION (if recommended):
-- CREATE INDEX CONCURRENTLY idx_resources_approved ON resources(id) WHERE is_approved = true;
--
-- This is more efficient than a full boolean index because:
-- 1. It only indexes approved rows
-- 2. RLS policy `is_approved = true` can use it directly
-- 3. Smaller index size = faster maintenance

-- ============================================================
-- 7. UPDATE VISIBILITY_RLS.sql BASED ON FINDINGS
-- ============================================================
-- After running the above analysis, update VISIBILITY_RLS.sql:
--
-- IF approved rows are a SMALL FRACTION (< 20%):
--   Replace lines 57-60 with:
--   CREATE INDEX IF NOT EXISTS idx_resources_approved ON resources(id) WHERE is_approved = true;
--
-- IF approved rows are a LARGE FRACTION (> 50%):
--   Keep the DROP statement (current behavior is correct)
--
-- IF approved rows are MODERATE (20-50%):
--   Check if planner uses index scan; keep if yes, drop if not
