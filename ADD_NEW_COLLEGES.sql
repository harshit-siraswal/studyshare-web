-- ============================================
-- ADD_NEW_COLLEGES.sql
-- Add new colleges to existing colleges table
-- Run in Supabase SQL Editor
-- ============================================

-- First, check the existing structure
-- SELECT * FROM colleges LIMIT 1;

-- Add location column if it doesn't exist
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS location TEXT;

-- Add domain column if it doesn't exist
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS domain TEXT UNIQUE;

-- Add is_active column if it doesn't exist
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Insert new colleges using actual column names
-- If your table has different column names, adjust below

-- KIET
INSERT INTO colleges (name, domain, is_active)
VALUES ('Krishna Institute of Engineering and Technology', 'kiet.edu', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- IIIT Bhagalpur
INSERT INTO colleges (name, domain, is_active)
VALUES ('IIIT Bhagalpur', 'iiitbh.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- IIIT Sonepat
INSERT INTO colleges (name, domain, is_active)
VALUES ('IIIT Sonepat', 'iiitsonepat.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- ABES Engineering College
INSERT INTO colleges (name, domain, is_active)
VALUES ('ABES Engineering College', 'abes.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- Delhi University
INSERT INTO colleges (name, domain, is_active)
VALUES ('Delhi University', 'du.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- Delhi University - alternate domain for students
INSERT INTO colleges (name, domain, is_active)
VALUES ('Delhi University (Students)', 'students.du.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET is_active = true;

-- Verify colleges were added
SELECT * FROM colleges WHERE is_active = true ORDER BY name;
