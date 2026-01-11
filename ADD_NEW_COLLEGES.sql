-- ============================================
-- ADD_NEW_COLLEGES.sql
-- Add new colleges to the colleges table
-- Run in Supabase SQL Editor
-- ============================================

-- Add colleges table if it doesn't exist
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    domain TEXT UNIQUE NOT NULL,
    students_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert new colleges (upsert - won't fail if already exists)
INSERT INTO colleges (id, name, location, domain, is_active)
VALUES 
    (9, 'Krishna Institute of Engineering and Technology', 'Ghaziabad', 'kiet.edu', true),
    (13, 'IIIT Bhagalpur', 'Bhagalpur, Bihar', 'iiitbh.ac.in', true),
    (14, 'IIIT Sonepat', 'Sonepat, Haryana', 'iiitsonepat.ac.in', true),
    (15, 'ABES Engineering College', 'Ghaziabad', 'abes.ac.in', true),
    (16, 'Delhi University', 'New Delhi', 'du.ac.in', true)
ON CONFLICT (domain) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    is_active = EXCLUDED.is_active;

-- Also add students.du.ac.in as alternate domain for DU
INSERT INTO colleges (id, name, location, domain, is_active)
VALUES 
    (17, 'Delhi University (Students)', 'New Delhi', 'students.du.ac.in', true)
ON CONFLICT (domain) DO NOTHING;

-- Verify colleges were added
SELECT id, name, domain, is_active FROM colleges ORDER BY id;
