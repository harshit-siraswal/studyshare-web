-- ==========================================
-- SETUP SCRIPT: Teacher Role & Permissions
-- ==========================================

-- 1. Create the teacher_emails reference table
CREATE TABLE IF NOT EXISTS public.teacher_emails (
    email TEXT PRIMARY KEY,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    added_by UUID REFERENCES auth.users(id) -- Optional: tracks who added the teacher
);

-- Enable RLS on the teacher table
ALTER TABLE public.teacher_emails ENABLE ROW LEVEL SECURITY;

-- Only Admins can manage the teacher_emails list
CREATE POLICY "Admins can manage teacher emails" ON public.teacher_emails
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'ADMIN'
        )
    );

-- Everyone can read the teacher emails (optional, useful for UI checks)
CREATE POLICY "Anyone can read teacher emails" ON public.teacher_emails
    FOR SELECT 
    USING (true);

-- 2. Trigger function to assign TEACHER role on insert
CREATE OR REPLACE FUNCTION public.assign_teacher_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the users table to grant TEACHER role where email matches
    UPDATE public.users
    SET role = 'TEACHER'
    WHERE email = NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the teacher_emails table
DROP TRIGGER IF EXISTS trg_assign_teacher_role ON public.teacher_emails;
CREATE TRIGGER trg_assign_teacher_role
AFTER INSERT ON public.teacher_emails
FOR EACH ROW
EXECUTE FUNCTION public.assign_teacher_role_on_insert();

-- 3. Trigger function to revoke TEACHER role on delete
CREATE OR REPLACE FUNCTION public.revoke_teacher_role_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Demote the user back to COLLEGE_USER or READ_ONLY 
    -- Assuming COLLEGE_USER is the standard verified state
    UPDATE public.users
    SET role = 'COLLEGE_USER'
    WHERE email = OLD.email AND role = 'TEACHER';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for deletion
DROP TRIGGER IF EXISTS trg_revoke_teacher_role ON public.teacher_emails;
CREATE TRIGGER trg_revoke_teacher_role
AFTER DELETE ON public.teacher_emails
FOR EACH ROW
EXECUTE FUNCTION public.revoke_teacher_role_on_delete();

-- 4. Sync existing users (Retroactive assignment)
-- If there are already users in the 'users' table whose emails are in 'teacher_emails', update them now.
UPDATE public.users
SET role = 'TEACHER'
WHERE email IN (SELECT email FROM public.teacher_emails);

-- 5. Trigger function: If a User signs up *after* their email was added to teacher_emails
CREATE OR REPLACE FUNCTION public.check_teacher_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.teacher_emails WHERE email = NEW.email) THEN
        NEW.role := 'TEACHER';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to the public.users table (Runs BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_check_teacher_role_on_signup ON public.users;
CREATE TRIGGER trg_check_teacher_role_on_signup
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.check_teacher_role_on_signup();
