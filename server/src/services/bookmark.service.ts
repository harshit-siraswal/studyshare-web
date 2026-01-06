import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

export interface Bookmark {
    id: string;
    resourceId: string;
    createdAt: string;
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userEmail: string): Promise<Bookmark[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('bookmarks')
        .select('id, resource_id, created_at')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[BookmarkService] Fetch error:', error);
        throw Errors.internal('Failed to fetch bookmarks');
    }

    return (data || []).map(b => ({
        id: b.id,
        resourceId: b.resource_id,
        createdAt: b.created_at,
    }));
}

/**
 * Add a bookmark
 */
export async function addBookmark(
    userEmail: string,
    resourceId: string
): Promise<Bookmark> {
    const supabase = getSupabaseAdmin();

    // Check if resource exists
    const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('id')
        .eq('id', resourceId)
        .single();

    if (resourceError || !resource) {
        throw Errors.notFound('Resource');
    }

    // Create bookmark
    const { data, error } = await supabase
        .from('bookmarks')
        .insert({
            user_email: userEmail,
            resource_id: resourceId,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw Errors.conflict('Resource already bookmarked');
        }
        console.error('[BookmarkService] Add error:', error);
        throw Errors.internal('Failed to add bookmark');
    }

    return {
        id: data.id,
        resourceId: data.resource_id,
        createdAt: data.created_at,
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

    // Verify ownership
    const { data: bookmark, error: fetchError } = await supabase
        .from('bookmarks')
        .select('user_email')
        .eq('id', bookmarkId)
        .single();

    if (fetchError || !bookmark) {
        throw Errors.notFound('Bookmark');
    }

    if (bookmark.user_email !== userEmail) {
        throw Errors.forbidden('You can only remove your own bookmarks');
    }

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

    if (error) {
        throw Errors.internal('Failed to remove bookmark');
    }
}

/**
 * Remove bookmark by resource ID
 */
export async function removeBookmarkByResource(
    userEmail: string,
    resourceId: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_email', userEmail)
        .eq('resource_id', resourceId);

    if (error) {
        throw Errors.internal('Failed to remove bookmark');
    }
}

/**
 * Check if a resource is bookmarked by user
 */
export async function isBookmarked(
    userEmail: string,
    resourceId: string
): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_email', userEmail)
        .eq('resource_id', resourceId)
        .single();

    return !!data;
}
