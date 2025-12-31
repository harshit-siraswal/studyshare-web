// Create this file at: src/hooks/useBookmarkSync.tsx

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../supabase';

interface Bookmark {
  id: string | number;
  title: string;
  type: string;
  subject: string;
  chapter: string;
}

interface BookmarkResource {
  resource_id: string;
  resources: {
    id: string | number;
    title: string;
    type: string;
    subject: string;
    chapter: string | null;
  } | null;
}

export const useBookmarkSync = (): void => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    const syncBookmarks = async (): Promise<void> => {
      try {
        // Fetch all bookmarks from database
        const { data: bookmarks, error } = await supabase
          .from('bookmarks')
          .select(`
            resource_id,
            resources (
              id,
              title,
              type,
              subject,
              chapter
            )
          `)
          .eq('user_id', user.uid)
          .not('resources', 'is', null);

        if (error) {
          console.error('Error fetching bookmarks:', error);
          return;
        }

        // Transform to localStorage format
        const formattedBookmarks: Bookmark[] = (bookmarks as BookmarkResource[])
          ?.map((b) => {
            const resource = b.resources;
            if (!resource) return null;
            
            return {
              id: resource.id,
              title: resource.title,
              type: resource.type,
              subject: resource.subject,
              chapter: resource.chapter || 'General',
            };
          })
          .filter((bookmark): bookmark is Bookmark => bookmark !== null) || [];

        // Save to localStorage
        localStorage.setItem('bookmarks', JSON.stringify(formattedBookmarks));
        
        // Trigger storage event for sidebar
        window.dispatchEvent(new Event('storage'));
      } catch (error) {
        console.error('Error syncing bookmarks:', error);
      }
    };

    syncBookmarks();
  }, [user]);
};