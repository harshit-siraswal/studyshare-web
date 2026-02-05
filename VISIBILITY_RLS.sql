-- Migration: Implement Content Visibility Logic
-- Description: Restricts visibility of unapproved resources to creators and followers only.
-- Note: Indexes are created non-concurrently for compatibility. For large tables in production,
--       consider running CREATE INDEX CONCURRENTLY outside a transaction during low-traffic windows.

-- ============================================================
-- 1. DROP OLD PERMISSIVE POLICY
-- ============================================================
DROP POLICY IF EXISTS "resources_read" ON resources;
DROP POLICY IF EXISTS "Public read resources" ON resources;
DROP POLICY IF EXISTS "Public read approved resources" ON resources;

-- ============================================================
-- 2. CREATE NEW VISIBILITY POLICY
-- ============================================================
-- Logic:
-- 1. Approved resources are visible to everyone
-- 2. Unapproved resources are visible to:
--    a. The uploader (creator)
--    b. Users who follow the uploader
--    c. (Implicitly) Service Role bypasses this for Admin

CREATE POLICY "resources_visibility_policy"
ON resources
FOR SELECT
USING (
  -- 1. Approved content (Public)
  is_approved = true
  
  OR
  
  -- 2. Own content (Creator)
  uploaded_by_email = (auth.jwt() ->> 'email')
  
  OR
  
  -- 3. Followed content (Followers)
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_email = (auth.jwt() ->> 'email') 
      AND following_email = resources.uploaded_by_email
  )
);

-- ============================================================
-- 3. ENSURE INDEXES FOR PERFORMANCE
-- ============================================================
-- The RLS policy relies on these columns, so indexes are critical.
-- 
-- Note: The RLS predicate evaluates (is_approved = true OR owner OR follower), so there's
-- no explicit "is_approved = false" filter the planner can use for partial indexes.
-- Instead, we rely on the full index on uploaded_by_email for ownership checks.

-- Index for creator/owner lookups
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by_email ON resources(uploaded_by_email);

-- Clean up unused boolean index (low selectivity, not used by RLS predicate)
DROP INDEX IF EXISTS idx_resources_is_approved;
-- Note: Removed idx_resources_unapproved partial index as the RLS policy does not include 
-- an explicit is_approved = false filter, so the planner cannot utilize it effectively.

-- Index for the join/subquery on follows
CREATE INDEX IF NOT EXISTS idx_follows_pair ON follows(follower_email, following_email);

-- ============================================================
-- FOR PRODUCTION WITH LARGE TABLES (Optional)
-- ============================================================
-- If you have large tables and need minimal downtime, run these OUTSIDE a transaction:
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_uploaded_by_email ON resources(uploaded_by_email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_pair ON follows(follower_email, following_email);
