import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface Notice {
    id: string;
    title: string;
    content: string;
    department: string;
    priority: string;
    file_url: string | null;
    file_type: 'pdf' | 'video' | 'image' | null;
    created_by: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
    likes: number;
    comments: number;
}

async function fetchNotices(): Promise<Notice[]> {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Ensure likes and comments have fallback values
    return (data || []).map(n => ({
        ...n,
        likes: n.likes || 0,
        comments: n.comments || 0,
    }));
}

/**
 * Custom hook for fetching notices with React Query caching.
 * Replaces manual useEffect + useState pattern for better performance.
 */
export function useNotices() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['notices'],
        queryFn: fetchNotices,
    });

    // Manual refresh function
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notices'] });
    };

    return {
        notices: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refresh,
        refetch: query.refetch,
    };
}

/**
 * Invalidate notices cache after mutations
 */
export function useInvalidateNotices() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['notices'] });
    };
}
