-- FIX_NOTIFICATIONS_TABLE.sql
-- Adds missing user_email column to notifications table
-- This fixes the Admin Dashboard error: column "user_email" of relation "notifications" does not exist

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'user_email';
