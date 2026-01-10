import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

export interface Notification {
    id: string;
    userEmail: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

/**
 * Create a notification
 * Uses user_email for consistency with frontend queries and follow.service.ts
 */
export async function createNotification(
    userEmail: string,
    title: string,
    message: string,
    type: string,
    link?: string,
    collegeId?: string
): Promise<Notification> {
    const supabase = getSupabaseAdmin();

    console.log('[NotificationService] Creating notification:', {
        userEmail,
        title,
        type,
        link,
        collegeId: collegeId || 'kiet.edu'
    });

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_email: userEmail,
            title,
            message,
            type,
            link,
            read: false,
            college_id: collegeId || 'kiet.edu',
        })
        .select()
        .single();

    if (error) {
        console.error('[NotificationService] Create error:', error);
        throw Errors.internal('Failed to create notification');
    }

    console.log('[NotificationService] Notification created:', data.id);
    return mapNotification(data);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userEmail: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_email', userEmail);

    if (error) {
        console.error('[NotificationService] Mark read error:', error);
        throw Errors.internal('Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userEmail: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_email', userEmail)
        .eq('read', false);

    if (error) {
        console.error('[NotificationService] Mark all read error:', error);
        throw Errors.internal('Failed to mark notifications as read');
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userEmail: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_email', userEmail);

    if (error) {
        console.error('[NotificationService] Delete error:', error);
        throw Errors.internal('Failed to delete notification');
    }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userEmail: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_email', userEmail);

    if (error) {
        console.error('[NotificationService] Delete all error:', error);
        throw Errors.internal('Failed to delete notifications');
    }
}

/**
 * Notify all followers of a department about a new notice
 */
export async function notifyDepartmentFollowers(
    departmentId: string,
    noticeTitle: string,
    noticeId: string,
    collegeId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get all followers of the department
    const { data: followers, error: fetchError } = await supabase
        .from('department_followers')
        .select('follower_email')
        .eq('department_id', departmentId);

    if (fetchError || !followers || followers.length === 0) {
        return; // No followers or error
    }

    // Create notifications for all followers
    const notifications = followers.map(follower => ({
        user_email: follower.follower_email,
        type: 'notice',
        title: 'New Notice',
        message: `${departmentId.toUpperCase()} department posted: ${noticeTitle}`,
        link: `/notices?id=${noticeId}`,
        read: false,
        college_id: collegeId,
    }));

    const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

    if (insertError) {
        console.error('[NotificationService] Notify department followers error:', insertError);
    }
}

/**
 * Notify all followers of a user about new content
 */
export async function notifyUserFollowers(
    authorEmail: string,
    contentTitle: string,
    contentType: 'resource' | 'post',
    link: string,
    collegeId?: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get all users who follow this author
    const { data: followers, error: fetchError } = await supabase
        .from('follows')
        .select('follower_email')
        .eq('following_email', authorEmail);

    if (fetchError || !followers || followers.length === 0) {
        return;
    }

    // Get author's display name
    const { data: author } = await supabase
        .from('users')
        .select('name, display_name')
        .eq('email', authorEmail)
        .single();

    const authorName = author?.display_name || author?.name || authorEmail.split('@')[0];

    // Create notifications for all followers
    const notifications = followers.map(follower => ({
        user_email: follower.follower_email,
        type: contentType,
        title: 'New Content',
        message: `${authorName} shared: ${contentTitle}`,
        link,
        read: false,
        college_id: collegeId || 'kiet.edu',
    }));

    const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

    if (insertError) {
        console.error('[NotificationService] Notify user followers error:', insertError);
    }
}

function mapNotification(row: any): Notification {
    return {
        id: row.id,
        userEmail: row.user_email,
        title: row.title,
        message: row.message,
        type: row.type,
        link: row.link,
        isRead: row.read,
        createdAt: row.created_at,
    };
}
