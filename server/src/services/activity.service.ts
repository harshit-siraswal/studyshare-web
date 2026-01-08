import { getSupabaseAdmin } from '../config/supabase';

export interface LogEntry {
    userEmail: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
}

/**
 * Log an activity to the database
 */
export async function logActivity(entry: LogEntry): Promise<void> {
    const supabase = getSupabaseAdmin();

    try {
        await supabase.from('activity_logs').insert({
            user_email: entry.userEmail,
            action: entry.action,
            resource_type: entry.resourceType,
            resource_id: entry.resourceId,
            ip_address: entry.ipAddress,
            user_agent: entry.userAgent,
            details: entry.details,
        });
    } catch (error) {
        // Don't throw - logging should not break the request
        console.error('[ActivityLog] Failed to log:', error);
    }
}

/**
 * Log action types for consistency
 */
export const Actions = {
    // Auth
    LOGIN: 'login',

    // Resources
    CREATE_RESOURCE: 'create_resource',
    UPDATE_RESOURCE: 'update_resource',
    DELETE_RESOURCE: 'delete_resource',

    // Follows
    SEND_FOLLOW_REQUEST: 'send_follow_request',
    APPROVE_FOLLOW: 'approve_follow',
    REJECT_FOLLOW: 'reject_follow',
    UNFOLLOW: 'unfollow',

    // Bookmarks
    ADD_BOOKMARK: 'add_bookmark',
    REMOVE_BOOKMARK: 'remove_bookmark',

    // Moderation
    BAN_USER: 'ban_user',
    UNBAN_USER: 'unban_user',
} as const;
