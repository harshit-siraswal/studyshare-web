import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

export interface Bookmark {
    id: string;
    resourceId?: string;
    noticeId?: string;
    createdAt: string;
    type: 'resource' | 'notice';
    content?: any; // Enriched content from join
}

/**
 * Get all bookmarks for a user (Resources + Notices)
 */
export async function getUserBookmarks(userEmail: string): Promise<Bookmark[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            id, 
            resource_id, 
            notice_id, 
            created_at,
            resource:resources(*),
            notice:notices(*)
        `)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[BookmarkService] Fetch error:', error);
        throw Errors.internal('Failed to fetch bookmarks');
    }

    return (data || []).map(b => {
        const isResource = !!b.resource_id;
        return {
            id: b.id,
            resourceId: b.resource_id,
            noticeId: b.notice_id,
            createdAt: b.created_at,
            type: isResource ? 'resource' : 'notice',
            content: isResource ? b.resource : b.notice
        };
    });
}

/**
 * Add a bookmark
 */
export async function addBookmark(
    userEmail: string,
    itemId: string,
    type: 'resource' | 'notice' = 'resource'
): Promise<Bookmark> {
    const supabase = getSupabaseAdmin();

    // Verify item existence based on type
    if (type === 'resource') {
        const { data, error } = await supabase.from('resources').select('id').eq('id', itemId).single();
        if (error || !data) throw Errors.notFound('Resource');
    } else {
        const { data, error } = await supabase.from('notices').select('id').eq('id', itemId).single();
        if (error || !data) throw Errors.notFound('Notice');
    }

    // Prepare insert payload
    const payload: any = { user_email: userEmail };
    if (type === 'resource') payload.resource_id = itemId;
    else payload.notice_id = itemId;

    // Insert
    const { data, error } = await supabase
        .from('bookmarks')
        .insert(payload)
        .select(`
            *,
            resource:resources(*),
            notice:notices(*)
        `)
        .single();

    if (error) {
        if (error.code === '23505') throw Errors.conflict('Already bookmarked');
        console.error('[BookmarkService] Add error:', error);
        throw Errors.internal('Failed to add bookmark');
    }

    const isResource = !!data.resource_id;
    return {
        id: data.id,
        resourceId: data.resource_id,
        noticeId: data.notice_id,
        createdAt: data.created_at,
        type: isResource ? 'resource' : 'notice',
        content: isResource ? data.resource : data.notice
    };
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(
    userEmail: string,
    bookmarkId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { data: bookmark, error: fetchError } = await supabase
        .from('bookmarks')
        .select('user_email')
        .eq('id', bookmarkId)
        .single();

    if (fetchError || !bookmark) throw Errors.notFound('Bookmark');
    if (bookmark.user_email !== userEmail) throw Errors.forbidden('Ownership required');

    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    if (error) throw Errors.internal('Failed to remove bookmark');
}

/**
 * Remove bookmark by Item ID (Resource OR Notice)
 */
export async function removeBookmarkByItem(
    userEmail: string,
    itemId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Try to delete where resource_id match OR notice_id match
    // Supabase JS doesn't support OR in .eq chain easily for DELETE with same column target?
    // But here columns are different.
    // We can just construct query based on checking existence?
    // Or just try specific deletions. Safe enough.

    // Check if it's a resource or notice?
    // Simpler: Try to delete where resource_id = itemId OR notice_id = itemId
    // But itemId is UUID.

    // We can assume we know the type if passed, OR just try both columns if only ID passed.
    // Best practice: Frontend sends ID. ID collision is unlikely (UUID).

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_email', userEmail)
        .or(`resource_id.eq.${itemId},notice_id.eq.${itemId}`);

    if (error) {
        // Checking error might be tricky if one col doesn't match type? UUID is UUID.
        console.error('[BookmarkService] Remove error:', error);
        throw Errors.internal('Failed to remove bookmark');
    }
}

/**
 * Check if item is bookmarked
 */
export async function isBookmarked(
    userEmail: string,
    itemId: string
): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    // Check either column
    const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_email', userEmail)
        .or(`resource_id.eq.${itemId},notice_id.eq.${itemId}`)
        .single();

    return !!data;
}
