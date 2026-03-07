-- KIET branch/semester subject catalog (B.Tech 1st Year, Session 2025-26)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS academic_subject_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (college_id, branch, semester, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_academic_subject_catalog_scope
  ON academic_subject_catalog (college_id, branch, semester, is_active);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_timestamp') THEN
    CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_academic_subject_catalog_updated_at ON academic_subject_catalog;
CREATE TRIGGER trg_academic_subject_catalog_updated_at
BEFORE UPDATE ON academic_subject_catalog
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Optional cleanup for KIET before reseeding.
DELETE FROM academic_subject_catalog WHERE college_id = 'fe2e3b2f-f628-49ef-8fb9-a350c808be2d'::uuid;

WITH data(branch, semester, subject_name) AS (
  VALUES
    -- CSE / CS
    ('cse', '1', 'Calculus for Engineers'),
    ('cse', '1', 'Semiconductor Physics and Devices'),
    ('cse', '1', 'Programming for Problem Solving'),
    ('cse', '1', 'Discrete Structures and Theory of Logic'),
    ('cse', '1', 'Design Thinking'),
    ('cse', '1', 'Introduction to IoT'),
    ('cse', '1', 'Semiconductor Physics and Devices Lab'),
    ('cse', '1', 'Programming for Problem Solving Lab'),
    ('cse', '1', 'Web Designing'),
    ('cse', '1', 'Communication Skills'),
    ('cse', '1', 'Indian Knowledge System'),
    ('cse', '2', 'Linear Algebra for Engineers'),
    ('cse', '2', 'Environmental Chemistry'),
    ('cse', '2', 'Computer Organization and Logic Design'),
    ('cse', '2', 'Data Structure'),
    ('cse', '2', 'Design and Realization'),
    ('cse', '2', 'Computer Organization and Logic Design Lab'),
    ('cse', '2', 'Python for Engineers'),
    ('cse', '2', 'Foreign Language'),
    ('cse', '2', 'Innovation and Entrepreneurship'),

    -- IT / CSIT
    ('it', '1', 'Calculus for Engineers'),
    ('it', '1', 'Semiconductor Physics and Devices'),
    ('it', '1', 'Programming for Problem Solving'),
    ('it', '1', 'Discrete Structures and Theory of Logic'),
    ('it', '1', 'Design Thinking'),
    ('it', '1', 'Introduction to IoT'),
    ('it', '1', 'Semiconductor Physics and Devices Lab'),
    ('it', '1', 'Programming for Problem Solving Lab'),
    ('it', '1', 'Web Designing'),
    ('it', '1', 'Communication Skills'),
    ('it', '2', 'Linear Algebra for Engineers'),
    ('it', '2', 'Environmental Chemistry'),
    ('it', '2', 'Computer Organization and Logic Design'),
    ('it', '2', 'Data Structure'),
    ('it', '2', 'Design and Realization'),
    ('it', '2', 'Computer Organization and Logic Design Lab'),
    ('it', '2', 'Python for Engineers'),
    ('it', '2', 'Foreign Language'),
    ('it', '2', 'Innovation and Entrepreneurship'),
    ('it', '2', 'Indian Knowledge System'),

    -- CSE (AI)
    ('cse_ai', '1', 'Calculus for Engineers'),
    ('cse_ai', '1', 'Semiconductor Physics and Devices'),
    ('cse_ai', '1', 'Programming for Problem Solving'),
    ('cse_ai', '1', 'Discrete Structures and Theory of Logic'),
    ('cse_ai', '1', 'Design Thinking'),
    ('cse_ai', '1', 'Introduction to IoT'),
    ('cse_ai', '1', 'Semiconductor Physics and Devices Lab'),
    ('cse_ai', '1', 'Programming for Problem Solving Lab'),
    ('cse_ai', '1', 'Web Designing'),
    ('cse_ai', '1', 'Communication Skills'),
    ('cse_ai', '2', 'Linear Algebra for Engineers'),
    ('cse_ai', '2', 'Environmental Chemistry'),
    ('cse_ai', '2', 'Computer Organization and Logic Design'),
    ('cse_ai', '2', 'Data Structure'),
    ('cse_ai', '2', 'Introduction to AI'),
    ('cse_ai', '2', 'Computer Organization and Logic Design Lab'),
    ('cse_ai', '2', 'Python for Engineers'),
    ('cse_ai', '2', 'Foreign Language'),
    ('cse_ai', '2', 'Innovation and Entrepreneurship'),
    ('cse_ai', '2', 'Indian Knowledge System'),

    -- CSE (AI & ML)
    ('aiml', '1', 'Calculus for Engineers'),
    ('aiml', '1', 'Semiconductor Physics and Devices'),
    ('aiml', '1', 'Programming for Problem Solving'),
    ('aiml', '1', 'Discrete Structures and Theory of Logic'),
    ('aiml', '1', 'Design Thinking'),
    ('aiml', '1', 'Introduction to IoT'),
    ('aiml', '1', 'Semiconductor Physics and Devices Lab'),
    ('aiml', '1', 'Programming for Problem Solving Lab'),
    ('aiml', '1', 'Web Designing'),
    ('aiml', '1', 'Communication Skills'),
    ('aiml', '2', 'Linear Algebra for Engineers'),
    ('aiml', '2', 'Environmental Chemistry'),
    ('aiml', '2', 'Computer Organization and Logic Design'),
    ('aiml', '2', 'Data Structure'),
    ('aiml', '2', 'Introduction to AI'),
    ('aiml', '2', 'Computer Organization and Logic Design Lab'),
    ('aiml', '2', 'Python for Engineers'),
    ('aiml', '2', 'Foreign Language'),
    ('aiml', '2', 'Innovation and Entrepreneurship'),
    ('aiml', '2', 'Indian Knowledge System'),

    -- CSE (Data Science)
    ('ds', '1', 'Calculus for Engineers'),
    ('ds', '1', 'Semiconductor Physics and Devices'),
    ('ds', '1', 'Programming for Problem Solving'),
    ('ds', '1', 'Discrete Structures and Theory of Logic'),
    ('ds', '1', 'Design Thinking'),
    ('ds', '1', 'Introduction to IoT'),
    ('ds', '1', 'Semiconductor Physics and Devices Lab'),
    ('ds', '1', 'Programming for Problem Solving Lab'),
    ('ds', '1', 'Web Designing'),
    ('ds', '1', 'Communication Skills'),
    ('ds', '1', 'Indian Knowledge System'),
    ('ds', '2', 'Linear Algebra for Engineers'),
    ('ds', '2', 'Computer Organization and Logic Design'),
    ('ds', '2', 'Data Structure'),
    ('ds', '2', 'Design and Realization'),
    ('ds', '2', 'Introduction to Data Science'),
    ('ds', '2', 'Computer Organization and Logic Design Lab'),
    ('ds', '2', 'Python for Engineers'),
    ('ds', '2', 'Foreign Language'),
    ('ds', '2', 'Innovation and Entrepreneurship'),

    -- CSE (Cyber Security)
    ('cse_cs', '1', 'Calculus for Engineers'),
    ('cse_cs', '1', 'Semiconductor Physics and Devices'),
    ('cse_cs', '1', 'Programming for Problem Solving'),
    ('cse_cs', '1', 'Discrete Structures and Theory of Logic'),
    ('cse_cs', '1', 'Design Thinking'),
    ('cse_cs', '1', 'Introduction to IoT'),
    ('cse_cs', '1', 'Semiconductor Physics and Devices Lab'),
    ('cse_cs', '1', 'Programming for Problem Solving Lab'),
    ('cse_cs', '1', 'Web Designing'),
    ('cse_cs', '1', 'Communication Skills'),
    ('cse_cs', '2', 'Linear Algebra for Engineers'),
    ('cse_cs', '2', 'Environmental Chemistry'),
    ('cse_cs', '2', 'Computer Organization and Logic Design'),
    ('cse_cs', '2', 'Data Structure'),
    ('cse_cs', '2', 'Introduction to Cyber Security'),
    ('cse_cs', '2', 'Computer Organization and Logic Design Lab'),
    ('cse_cs', '2', 'Python for Engineers'),
    ('cse_cs', '2', 'Foreign Language'),
    ('cse_cs', '2', 'Innovation and Entrepreneurship'),
    ('cse_cs', '2', 'Indian Knowledge System'),

    -- Mechanical Engineering
    ('me', '1', 'Calculus for Engineers'),
    ('me', '1', 'Semiconductor Physics and Devices'),
    ('me', '1', 'Programming for Problem Solving'),
    ('me', '1', 'Explorations in Electrical Engineering'),
    ('me', '1', 'Design Thinking'),
    ('me', '1', 'Introduction to IoT'),
    ('me', '1', 'Semiconductor Physics and Devices Lab'),
    ('me', '1', 'Programming for Problem Solving Lab'),
    ('me', '1', 'Explorations in Electrical Engineering Lab'),
    ('me', '1', 'Communication Skills'),
    ('me', '1', 'Indian Knowledge System'),
    ('me', '2', 'Differential Equations & Complex Integration'),
    ('me', '2', 'Environmental Chemistry'),
    ('me', '2', 'Engineering Mechanics'),
    ('me', '2', 'Data Structure'),
    ('me', '2', 'Design and Realization'),
    ('me', '2', 'Emerging Technologies for Engineers'),
    ('me', '2', 'Python for Engineers'),
    ('me', '2', 'Foreign Language'),
    ('me', '2', 'Innovation and Entrepreneurship'),

    -- AM & IA
    ('amia', '1', 'Calculus for Engineers'),
    ('amia', '1', 'Environmental Chemistry'),
    ('amia', '1', 'Fundamentals of Mechatronics and Industrial Automation'),
    ('amia', '1', 'Programming for Problem Solving'),
    ('amia', '1', 'Explorations in Electrical Engineering'),
    ('amia', '1', 'Design Thinking'),
    ('amia', '1', 'Introduction to IoT'),
    ('amia', '1', 'Programming for Problem Solving Lab'),
    ('amia', '1', 'Explorations in Electrical Engineering Lab'),
    ('amia', '1', 'Communication Skills'),
    ('amia', '1', 'Indian Knowledge System'),
    ('amia', '2', 'Differential Equations & Complex Integration'),
    ('amia', '2', 'Semiconductor Physics and Devices'),
    ('amia', '2', 'Data Structure'),
    ('amia', '2', 'Design and Realization'),
    ('amia', '2', 'Emerging Technologies for Engineers'),
    ('amia', '2', 'Semiconductor Physics and Devices Lab'),
    ('amia', '2', 'Python for Engineers'),
    ('amia', '2', 'Foreign Language'),
    ('amia', '2', 'Innovation and Entrepreneurship'),

    -- ELCE
    ('elce', '1', 'Calculus for Engineers'),
    ('elce', '1', 'Semiconductor Physics and Devices'),
    ('elce', '1', 'Programming for Problem Solving'),
    ('elce', '1', 'Explorations in Electrical Engineering'),
    ('elce', '1', 'Design Thinking'),
    ('elce', '1', 'Introduction to IoT'),
    ('elce', '1', 'Semiconductor Physics and Devices Lab'),
    ('elce', '1', 'Programming for Problem Solving Lab'),
    ('elce', '1', 'Explorations in Electrical Engineering Lab'),
    ('elce', '1', 'Communication Skills'),
    ('elce', '2', 'Linear Algebra for Engineers'),
    ('elce', '2', 'Environmental Chemistry'),
    ('elce', '2', 'Computer Organization and Logic Design'),
    ('elce', '2', 'Data Structure'),
    ('elce', '2', 'Design and Realization'),
    ('elce', '2', 'Computer Organization and Logic Design Lab'),
    ('elce', '2', 'Python for Engineers'),
    ('elce', '2', 'Computer Aided Electrical Design'),
    ('elce', '2', 'Foreign Language'),
    ('elce', '2', 'Innovation and Entrepreneurship'),
    ('elce', '2', 'Indian Knowledge System'),

    -- EEE
    ('eee', '1', 'Calculus for Engineers'),
    ('eee', '1', 'Semiconductor Physics and Devices'),
    ('eee', '1', 'Programming for Problem Solving'),
    ('eee', '1', 'Explorations in Electrical Engineering'),
    ('eee', '1', 'Design Thinking'),
    ('eee', '1', 'Introduction to IoT'),
    ('eee', '1', 'Semiconductor Physics and Devices Lab'),
    ('eee', '1', 'Programming for Problem Solving Lab'),
    ('eee', '1', 'Explorations in Electrical Engineering Lab'),
    ('eee', '1', 'Communication Skills'),
    ('eee', '1', 'Indian Knowledge System'),
    ('eee', '2', 'Linear Algebra for Engineers'),
    ('eee', '2', 'Environmental Chemistry'),
    ('eee', '2', 'Digital Logic Design'),
    ('eee', '2', 'Data Structure'),
    ('eee', '2', 'Design and Realization'),
    ('eee', '2', 'Emerging Technologies for Engineers'),
    ('eee', '2', 'Python for Engineers'),
    ('eee', '2', 'Foreign Language'),
    ('eee', '2', 'Innovation and Entrepreneurship'),

    -- ECE
    ('ece', '1', 'Calculus for Engineers'),
    ('ece', '1', 'Environmental Chemistry'),
    ('ece', '1', 'Programming for Problem Solving'),
    ('ece', '1', 'Computer Organization and Logic Design'),
    ('ece', '1', 'Design Thinking'),
    ('ece', '1', 'Intelligent Health Care Systems'),
    ('ece', '1', 'Introduction to IoT'),
    ('ece', '1', 'Computer Organization and Logic Design Lab'),
    ('ece', '1', 'Programming for Problem Solving Lab'),
    ('ece', '1', 'Intelligent Health Care Systems Lab'),
    ('ece', '1', 'Communication Skills'),
    ('ece', '1', 'Indian Knowledge System'),
    ('ece', '2', 'Linear Algebra for Engineers'),
    ('ece', '2', 'Semiconductor Physics and Devices'),
    ('ece', '2', 'Explorations in Electrical Engineering'),
    ('ece', '2', 'Data Structure'),
    ('ece', '2', 'Design and Realization'),
    ('ece', '2', 'Semiconductor Physics and Devices Lab'),
    ('ece', '2', 'Python for Engineers'),
    ('ece', '2', 'Foreign Language'),
    ('ece', '2', 'Innovation and Entrepreneurship'),

    -- ECE (VLSI)
    ('ece_vlsi', '1', 'Calculus for Engineers'),
    ('ece_vlsi', '1', 'Environmental Chemistry'),
    ('ece_vlsi', '1', 'Explorations in Electrical Engineering'),
    ('ece_vlsi', '1', 'Programming for Problem Solving'),
    ('ece_vlsi', '1', 'Computer Organization and Logic Design'),
    ('ece_vlsi', '1', 'Design Thinking'),
    ('ece_vlsi', '1', 'Design and Realization'),
    ('ece_vlsi', '1', 'Computer Organization and Logic Design Lab'),
    ('ece_vlsi', '1', 'Programming for Problem Solving Lab'),
    ('ece_vlsi', '1', 'Communication Skills'),
    ('ece_vlsi', '1', 'Indian Knowledge System'),
    ('ece_vlsi', '2', 'Linear Algebra for Engineers'),
    ('ece_vlsi', '2', 'Semiconductor Physics and Devices'),
    ('ece_vlsi', '2', 'Digital Logic Design using HDL'),
    ('ece_vlsi', '2', 'Data Structure'),
    ('ece_vlsi', '2', 'Basic Electronics Engineering'),
    ('ece_vlsi', '2', 'Semiconductor Physics and Devices Lab'),
    ('ece_vlsi', '2', 'Digital Logic Design using HDL Lab'),
    ('ece_vlsi', '2', 'Python for Engineers'),
    ('ece_vlsi', '2', 'Foreign Language'),
    ('ece_vlsi', '2', 'Innovation and Entrepreneurship')
)
INSERT INTO academic_subject_catalog (college_id, branch, semester, subject_name, is_active)
SELECT
  'fe2e3b2f-f628-49ef-8fb9-a350c808be2d'::uuid,
  data.branch,
  data.semester,
  data.subject_name,
  TRUE
FROM data
ON CONFLICT (college_id, branch, semester, subject_name)
DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
