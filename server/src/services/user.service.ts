import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

/**
 * Get user profile by ID
 */
export async function getUserProfileById(uid: string) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[UserService] Get profile error:', error);
        throw Errors.internal('Failed to fetch user profile');
    }

    return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    uid: string,
    data: {
        display_name?: string;
        username?: string;
        bio?: string;
        profile_photo_url?: string;
        college?: string;
        branch?: string;
        semester?: string;
    }
) {
    const supabase = getSupabaseAdmin();

    // Check username uniqueness if provided
    if (data.username) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', data.username)
            .neq('id', uid)
            .single();

        if (existing) {
            throw Errors.conflict('Username already taken');
        }
    }

    const { data: updated, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', uid)
        .select()
        .single();

    if (error) {
        console.error('[UserService] Update profile error:', error);
        throw Errors.internal('Failed to update profile');
    }

    return updated;
}

/**
 * Create user profile if doesn't exist
 */
export async function createUserProfile(
    uid: string,
    email: string,
    displayName: string,
    photoUrl?: string,
    college?: string
) {
    const supabase = getSupabaseAdmin();

    // Check if exists
    const existing = await getUserProfileById(uid);
    if (existing) return existing;

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

    const { data, error } = await supabase
        .from('users')
        .insert({
            id: uid,
            email,
            display_name: displayName,
            username,
            profile_photo_url: photoUrl,
            college: college || '',
            role: 'student'
        })
        .select()
        .single();

    if (error) {
        console.error('[UserService] Create profile error:', error);
        throw Errors.internal('Failed to create profile');
    }

    return data;
}

/**
 * Check if a user is banned (globally or for a specific college)
 * Used by admin-studyspace for ban feature integration
 */
export async function isUserBanned(email: string, collegeId?: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
        // Check for ban: either global (college_id is null) or specific college
        let query = supabase
            .from('banned_users')
            .select('id')
            .eq('email', email);

        if (collegeId) {
            // Check for global ban OR college-specific ban
            query = query.or(`college_id.is.null,college_id.eq.${collegeId}`);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('[UserService] Check ban error:', error);
            return false; // Fail open - don't block on error
        }

        return !!data;
    } catch (error) {
        console.error('[UserService] isUserBanned error:', error);
        return false;
    }
}

/**
 * Get ban info including reason (for displaying to banned users)
 */
export async function getBanInfo(email: string): Promise<{ isBanned: boolean; reason: string | null }> {
    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase
            .from('banned_users')
            .select('reason, banned_at')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('[UserService] getBanInfo error:', error);
            return { isBanned: false, reason: null };
        }

        if (data) {
            return { isBanned: true, reason: data.reason || 'You have been banned by an administrator' };
        }

        return { isBanned: false, reason: null };
    } catch (error) {
        console.error('[UserService] getBanInfo error:', error);
        return { isBanned: false, reason: null };
    }
}

/**
 * Ban a user (for admin-studyspace integration)
 */
export async function banUser(
    email: string,
    bannedBy: string,
    reason?: string,
    collegeId?: string
): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
        const { error } = await supabase
            .from('banned_users')
            .insert({
                email,
                banned_by: bannedBy,
                reason: reason || 'Banned by admin',
                college_id: collegeId || null,
                banned_at: new Date().toISOString()
            });

        if (error) {
            console.error('[UserService] Ban user error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[UserService] banUser error:', error);
        return false;
    }
}

/**
 * Unban a user
 */
export async function unbanUser(email: string, collegeId?: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
        let query = supabase
            .from('banned_users')
            .delete()
            .eq('email', email);

        if (collegeId) {
            query = query.eq('college_id', collegeId);
        }

        const { error } = await query;

        if (error) {
            console.error('[UserService] Unban user error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[UserService] unbanUser error:', error);
        return false;
    }
}

/**
 * Get all banned users (optionally filtered by college)
 */
export async function getBannedUsers(collegeId?: string): Promise<Array<{
    email: string;
    banned_by: string;
    reason: string;
    college_id: string | null;
    banned_at: string;
}>> {
    const supabase = getSupabaseAdmin();

    try {
        let query = supabase
            .from('banned_users')
            .select('email, banned_by, reason, college_id, banned_at')
            .order('banned_at', { ascending: false });

        if (collegeId) {
            query = query.or(`college_id.eq.${collegeId},college_id.is.null`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[UserService] Get banned users error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('[UserService] getBannedUsers error:', error);
        return [];
    }
}
