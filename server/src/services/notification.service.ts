import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

/**
 * Create a notification
 */
export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    link?: string
): Promise<Notification> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            message,
            type,
            link,
            is_read: false,
        })
        .select()
        .single();

    if (error) {
        console.error('[NotificationService] Create error:', error);
        throw Errors.internal('Failed to create notification');
    }

    return mapNotification(data);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

    if (error) {
        console.error('[NotificationService] Mark read error:', error);
        throw Errors.internal('Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('[NotificationService] Mark all read error:', error);
        throw Errors.internal('Failed to mark notifications as read');
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

    if (error) {
        console.error('[NotificationService] Delete error:', error);
        throw Errors.internal('Failed to delete notification');
    }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('[NotificationService] Delete all error:', error);
        throw Errors.internal('Failed to delete notifications');
    }
}

function mapNotification(row: any): Notification {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        message: row.message,
        type: row.type,
        link: row.link,
        isRead: row.is_read,
        createdAt: row.created_at,
    };
}
