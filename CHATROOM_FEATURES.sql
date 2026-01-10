-- ========================================
-- CHATROOM_FEATURES.sql
-- Add room_code for private rooms
-- ========================================

-- Add room_code column for private room access
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS room_code TEXT;

-- Create index for room_code lookups
CREATE INDEX IF NOT EXISTS idx_chat_rooms_room_code ON chat_rooms(room_code);

-- Update function to generate room code on private room creation
-- Note: This is done in backend code, not trigger, for better control

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_rooms' 
AND column_name IN ('room_code');
