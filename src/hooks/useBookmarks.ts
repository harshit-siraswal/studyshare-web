// src/hooks/useBookmarks.ts
// MIGRATED: Now uses backend API instead of direct Supabase calls
// All bookmark operations go through authenticated backend endpoints

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as api from '@/lib/api';

interface Bookmark {
    id: string;
    resource_id: string;
    created_at: string;
}

interface UseBookmarksReturn {
    bookmarks: Bookmark[];
    bookmarkedIds: Set<string>;
    loading: boolean;
    addBookmark: (resourceId: string) => Promise<boolean>;
    removeBookmark: (resourceId: string) => Promise<boolean>;
    isBookmarked: (resourceId: string) => boolean;
    toggleBookmark: (resourceId: string) => Promise<boolean>;
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
            const bookmarkData = response.bookmarks.map(b => ({
                id: b.id,
                resource_id: b.resourceId,
                created_at: b.createdAt,
            }));
            setBookmarks(bookmarkData);
            setBookmarkedIds(new Set(bookmarkData.map(b => b.resource_id)));
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
    const addBookmark = useCallback(async (resourceId: string): Promise<boolean> => {
        if (!user?.email) {
            toast.error('Please login to bookmark');
            return false;
        }

        try {
            await api.addBookmark(resourceId);

            // Update local state
            setBookmarkedIds(prev => new Set([...prev, resourceId]));
            toast.success('Bookmarked!');
            return true;
        } catch (error: any) {
            console.error('Error adding bookmark:', error);
            if (error.message?.includes('already')) {
                // Already bookmarked - not an error
                setBookmarkedIds(prev => new Set([...prev, resourceId]));
                return true;
            }
            toast.error('Failed to bookmark');
            return false;
        }
    }, [user?.email]);

    // Remove bookmark via backend API
    const removeBookmark = useCallback(async (resourceId: string): Promise<boolean> => {
        if (!user?.email) return false;

        try {
            await api.removeBookmarkByResource(resourceId);

            // Update local state
            setBookmarkedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(resourceId);
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
    const isBookmarked = useCallback((resourceId: string): boolean => {
        return bookmarkedIds.has(resourceId);
    }, [bookmarkedIds]);

    // Toggle bookmark
    const toggleBookmark = useCallback(async (resourceId: string): Promise<boolean> => {
        if (isBookmarked(resourceId)) {
            return removeBookmark(resourceId);
        } else {
            return addBookmark(resourceId);
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
