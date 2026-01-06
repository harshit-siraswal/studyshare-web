-- ADD_NEW_COLLEGE.sql
-- Template for adding a new college to StudySpace
-- Instructions: Replace the placeholder values and run in Supabase SQL Editor

-- ========================================
-- ADD NEW COLLEGE
-- ========================================
-- Format: INSERT INTO colleges (id, name, domain, logo_url, is_active) VALUES (...)

-- Template:
-- INSERT INTO colleges (id, name, domain, logo_url, is_active)
-- VALUES ('college_id', 'Full College Name', 'email.domain.edu', NULL, true);

-- ========================================
-- EXAMPLE COLLEGES
-- ========================================

-- IIIT Bhagalpur (already added in MULTI_COLLEGE_SETUP.sql)
-- INSERT INTO colleges (id, name, domain, logo_url, is_active)
-- VALUES ('iiitbh', 'Indian Institute of Information Technology Bhagalpur', 'iiitbh.ac.in', NULL, true);

-- IIT Delhi example
-- INSERT INTO colleges (id, name, domain, logo_url, is_active)
-- VALUES ('iitd', 'Indian Institute of Technology Delhi', 'iitd.ac.in', NULL, true);

-- NIT Trichy example
-- INSERT INTO colleges (id, name, domain, logo_url, is_active)
-- VALUES ('nitt', 'National Institute of Technology Tiruchirappalli', 'nitt.edu', NULL, true);

-- ========================================
-- VIEW ALL COLLEGES
-- ========================================
-- SELECT * FROM colleges ORDER BY name;

-- ========================================
-- ACTIVATE/DEACTIVATE COLLEGE
-- ========================================
-- UPDATE colleges SET is_active = false WHERE id = 'college_id';
-- UPDATE colleges SET is_active = true WHERE id = 'college_id';

-- ========================================
-- UPDATE COLLEGE DOMAIN
-- ========================================
-- UPDATE colleges SET domain = 'new.domain.edu' WHERE id = 'college_id';
