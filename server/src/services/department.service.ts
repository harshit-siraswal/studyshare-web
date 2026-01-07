import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

/**
 * Follow a department
 */
export async function followDepartment(
    userEmail: string,
    departmentId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('department_followers')
        .insert({
            follower_email: userEmail,
            department_id: departmentId
        });

    if (error) {
        if (error.code === '23505') return; // Already following
        console.error('[DepartmentService] Follow error:', error);
        throw Errors.internal('Failed to follow department');
    }
}

/**
 * Unfollow a department
 */
export async function unfollowDepartment(
    userEmail: string,
    departmentId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('department_followers')
        .delete()
        .eq('follower_email', userEmail)
        .eq('department_id', departmentId);

    if (error) {
        console.error('[DepartmentService] Unfollow error:', error);
        throw Errors.internal('Failed to unfollow department');
    }
}

/**
 * Get followed departments
 */
export async function getFollowedDepartments(userEmail: string): Promise<string[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('department_followers')
        .select('department_id')
        .eq('follower_email', userEmail);

    if (error) {
        console.error('[DepartmentService] Fetch error:', error);
        throw Errors.internal('Failed to fetch followed departments');
    }

    return (data || []).map(row => row.department_id);
}
