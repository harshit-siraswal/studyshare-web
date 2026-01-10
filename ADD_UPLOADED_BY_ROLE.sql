-- ========================================
-- ADD_UPLOADED_BY_ROLE.sql
-- Add role tracking for resource uploads
-- ========================================

-- Add uploaded_by_role column to resources
-- Values: 'student', 'admin', 'teacher'
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT DEFAULT 'student';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by_role ON resources(uploaded_by_role);

-- Update existing admin-uploaded resources (if you know admin emails)
-- Example: UPDATE resources SET uploaded_by_role = 'admin' WHERE uploaded_by_email IN ('admin@kiet.edu');

-- Verification
SELECT 
    uploaded_by_role,
    COUNT(*) as count
FROM resources
GROUP BY uploaded_by_role;
