import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useCollege } from '@/context/CollegeContext';

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
    college_id?: string;
}

async function fetchNotices(collegeId: string): Promise<Notice[]> {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .eq('college_id', collegeId)
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
 * Filters notices by selected college for data isolation.
 */
export function useNotices() {
    const { selectedCollege } = useCollege();
    const queryClient = useQueryClient();
    const collegeId = selectedCollege?.domain || 'kiet.edu';

    const query = useQuery({
        queryKey: ['notices', collegeId],
        queryFn: () => fetchNotices(collegeId),
        enabled: !!collegeId,
    });

    // Manual refresh function
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notices', collegeId] });
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
