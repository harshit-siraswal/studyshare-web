-- Migration Plan for Existing Rooms
-- Scenario: All existing rooms have expires_at = NULL.
-- Goal: Set them to expire 1 week from TODAY, so users have a grace period.
-- Result: They will be visible for 1 week, then disappear (filtered out by backend).

-- 1. Updates rooms with NULL expiration to expire 7 days from now
UPDATE public.chat_rooms
SET expires_at = NOW() + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- 2. (Optional) If you want to make them last longer (e.g. 1 month courtesy)
-- UPDATE public.chat_rooms
-- SET expires_at = NOW() + INTERVAL '30 days'
-- WHERE expires_at IS NULL;
