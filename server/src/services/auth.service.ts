import { getSupabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { UserRole } from '../middleware/rbac.js';

export interface UserInfo {
    email: string;
    role: UserRole;
    collegeDomain: string | null;
    isCollegeUser: boolean;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
        branch?: string;
        semester?: string;
    };
}

/**
 * Resolve user role from database or email domain
 */
export async function getUserRole(email: string): Promise<UserRole> {
    const supabase = getSupabaseAdmin();

    // Check for explicit role in database
    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_email', email)
        .single();

    if (roleData?.role) {
        return roleData.role as UserRole;
    }

    // Check if email domain matches a college
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const isCollegeEmail = env.collegeDomains.includes(
        emailDomain as typeof env.collegeDomains[number]
    );

    return isCollegeEmail ? 'COLLEGE_USER' : 'READ_ONLY';
}

/**
 * Get user info including role and profile
 */
export async function getUserInfo(email: string): Promise<UserInfo> {
    const supabase = getSupabaseAdmin();
    const emailDomain = email.split('@')[1]?.toLowerCase();

    const isCollegeUser = env.collegeDomains.includes(
        emailDomain as typeof env.collegeDomains[number]
    );

    const role = await getUserRole(email);

    // Try to get profile
    const { data: profile } = await supabase
        .from('users')
        .select('name, avatar_url, branch, semester')
        .eq('email', email)
        .single();

    return {
        email,
        role,
        collegeDomain: isCollegeUser ? emailDomain : null,
        isCollegeUser,
        profile: profile ? {
            displayName: profile.name,
            avatarUrl: profile.avatar_url,
            branch: profile.branch,
            semester: profile.semester,
        } : undefined,
    };
}

/**
 * Map email domain to college info
 */
export function getCollegeFromEmail(email: string): { domain: string; name: string } | null {
    const emailDomain = email.split('@')[1]?.toLowerCase();

    const collegeMap: Record<string, string> = {
        'kiet.edu': 'KIET Group of Institutions',
        'iiitbh.ac.in': 'Indian Institute of Information Technology Bhagalpur',
    };

    if (collegeMap[emailDomain]) {
        return {
            domain: emailDomain,
            name: collegeMap[emailDomain],
        };
    }

    return null;
}
