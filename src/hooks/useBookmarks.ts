// src/hooks/useBookmarks.ts
// MIGRATED: Now uses backend API instead of direct Supabase calls
// Supports both Resources AND Notices (Twitter-style bookmarks)

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as api from '@/lib/api';

// Global cache to prevent duplicate fetches across multiple hook instances
let globalBookmarksCache: Bookmark[] | null = null;
let globalBookmarkIdsCache: Set<string> | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchEmail: string | null = null;

interface Bookmark {
    id: string;
    resourceId?: string;
    noticeId?: string;
    type: 'resource' | 'notice';
    createdAt: string;
    content?: any;
}

interface UseBookmarksReturn {
    bookmarks: Bookmark[];
    bookmarkedIds: Set<string>; // Contains both resource IDs and notice IDs
    loading: boolean;
    addBookmark: (itemId: string, type?: 'resource' | 'notice') => Promise<boolean>;
    removeBookmark: (itemId: string) => Promise<boolean>;
    isBookmarked: (itemId: string) => boolean;
    toggleBookmark: (itemId: string, type?: 'resource' | 'notice') => Promise<boolean>;
    refresh: () => Promise<void>;
}

export const useBookmarks = (): UseBookmarksReturn => {
    const { user } = useAuth();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(globalBookmarksCache || []);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(globalBookmarkIdsCache || new Set());
    const [loading, setLoading] = useState(!globalBookmarksCache);
    const hasFetchedRef = useRef(false);

    // Fetch all bookmarks via backend API (with global deduplication)
    const fetchBookmarks = useCallback(async (force = false) => {
        if (!user?.email) {
            setBookmarks([]);
            setBookmarkedIds(new Set());
            setLoading(false);
            return;
        }

        // Use cached data if same user and not forcing refresh
        if (!force && globalBookmarksCache && lastFetchEmail === user.email) {
            setBookmarks(globalBookmarksCache);
            setBookmarkedIds(globalBookmarkIdsCache || new Set());
            setLoading(false);
            return;
        }

        // If fetch is already in progress, wait for it
        if (fetchPromise && !force) {
            await fetchPromise;
            setBookmarks(globalBookmarksCache || []);
            setBookmarkedIds(globalBookmarkIdsCache || new Set());
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            fetchPromise = (async () => {
                const response = await api.getBookmarks();
                globalBookmarksCache = response.bookmarks;
                lastFetchEmail = user.email;

                // Build set of all bookmarked item IDs (resources + notices)
                const ids = new Set<string>();
                response.bookmarks.forEach(b => {
                    if (b.resourceId) ids.add(b.resourceId);
                    if (b.noticeId) ids.add(b.noticeId);
                });
                globalBookmarkIdsCache = ids;
            })();

            await fetchPromise;
            setBookmarks(globalBookmarksCache || []);
            setBookmarkedIds(globalBookmarkIdsCache || new Set());
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
            fetchPromise = null;
        }
    }, [user?.email]);

    // Initial fetch (only once per hook instance)
    useEffect(() => {
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchBookmarks();
        }
    }, [fetchBookmarks]);

    // Add bookmark via backend API
    const addBookmark = useCallback(async (
        itemId: string,
        type: 'resource' | 'notice' = 'resource'
    ): Promise<boolean> => {
        if (!user?.email) {
            toast.error('Please login to bookmark');
            return false;
        }

        try {
            await api.addBookmark(itemId, type);

            // Update local state AND global cache
            setBookmarkedIds(prev => new Set([...prev, itemId]));
            if (globalBookmarkIdsCache) {
                globalBookmarkIdsCache.add(itemId);
            }
            toast.success('Bookmarked!');
            return true;
        } catch (error: any) {
            console.error('Error adding bookmark:', error);
            if (error.message?.includes('already') || error.message?.includes('Already')) {
                setBookmarkedIds(prev => new Set([...prev, itemId]));
                if (globalBookmarkIdsCache) {
                    globalBookmarkIdsCache.add(itemId);
                }
                return true;
            }
            toast.error('Failed to bookmark');
            return false;
        }
    }, [user?.email]);

    // Remove bookmark via backend API
    const removeBookmark = useCallback(async (itemId: string): Promise<boolean> => {
        if (!user?.email) return false;

        try {
            await api.removeBookmarkByItem(itemId);

            // Update local state AND global cache
            setBookmarkedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
            if (globalBookmarkIdsCache) {
                globalBookmarkIdsCache.delete(itemId);
            }
            toast.success('Bookmark removed');
            return true;
        } catch (error) {
            console.error('Error removing bookmark:', error);
            toast.error('Failed to remove bookmark');
            return false;
        }
    }, [user?.email]);

    // Check if bookmarked
    const isBookmarked = useCallback((itemId: string): boolean => {
        return bookmarkedIds.has(itemId);
    }, [bookmarkedIds]);

    // Toggle bookmark
    const toggleBookmark = useCallback(async (
        itemId: string,
        type: 'resource' | 'notice' = 'resource'
    ): Promise<boolean> => {
        if (isBookmarked(itemId)) {
            return removeBookmark(itemId);
        } else {
            return addBookmark(itemId, type);
        }
    }, [isBookmarked, addBookmark, removeBookmark]);

    return {
        bookmarks,
        bookmarkedIds,
        loading,
        addBookmark,
        removeBookmark,
        isBookmarked,
        toggleBookmark,
        refresh: () => fetchBookmarks(true),
    };
};

export default useBookmarks;
