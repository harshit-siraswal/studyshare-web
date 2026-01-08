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
