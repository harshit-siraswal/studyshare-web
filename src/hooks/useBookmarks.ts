// src/hooks/useBookmarks.ts
// MIGRATED: Now uses backend API instead of direct Supabase calls
// Supports both Resources AND Notices (Twitter-style bookmarks)

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as api from '@/lib/api';

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
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Fetch all bookmarks via backend API
    const fetchBookmarks = useCallback(async () => {
        if (!user?.email) {
            setBookmarks([]);
            setBookmarkedIds(new Set());
            setLoading(false);
            return;
        }

        try {
            const response = await api.getBookmarks();
            setBookmarks(response.bookmarks);

            // Build set of all bookmarked item IDs (resources + notices)
            const ids = new Set<string>();
            response.bookmarks.forEach(b => {
                if (b.resourceId) ids.add(b.resourceId);
                if (b.noticeId) ids.add(b.noticeId);
            });
            setBookmarkedIds(ids);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    // Initial fetch
    useEffect(() => {
        fetchBookmarks();
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

            // Update local state
            setBookmarkedIds(prev => new Set([...prev, itemId]));
            toast.success('Bookmarked!');
            return true;
        } catch (error: any) {
            console.error('Error adding bookmark:', error);
            if (error.message?.includes('already') || error.message?.includes('Already')) {
                setBookmarkedIds(prev => new Set([...prev, itemId]));
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

            // Update local state
            setBookmarkedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
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
        refresh: fetchBookmarks,
    };
};

export default useBookmarks;
