// src/hooks/useBookmarks.ts
// NEW: Simple DB-first bookmark hook
// Replaces flawed useBookmarkSync.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

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

    // Fetch all bookmarks for current user
    const fetchBookmarks = useCallback(async () => {
        if (!user?.email) {
            setBookmarks([]);
            setBookmarkedIds(new Set());
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .select('id, resource_id, created_at')
                .eq('user_email', user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const bookmarkData = data || [];
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

    // Add bookmark
    const addBookmark = useCallback(async (resourceId: string): Promise<boolean> => {
        if (!user?.email) {
            toast.error('Please login to bookmark');
            return false;
        }

        try {
            const { error } = await supabase
                .from('bookmarks')
                .insert([{
                    user_email: user.email,
                    resource_id: resourceId,
                }]);

            if (error) {
                if (error.code === '23505') {
                    // Already bookmarked - not an error
                    return true;
                }
                throw error;
            }

            // Update local state
            setBookmarkedIds(prev => new Set([...prev, resourceId]));
            toast.success('Bookmarked!');
            return true;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            toast.error('Failed to bookmark');
            return false;
        }
    }, [user?.email]);

    // Remove bookmark
    const removeBookmark = useCallback(async (resourceId: string): Promise<boolean> => {
        if (!user?.email) return false;

        try {
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('user_email', user.email)
                .eq('resource_id', resourceId);

            if (error) throw error;

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
