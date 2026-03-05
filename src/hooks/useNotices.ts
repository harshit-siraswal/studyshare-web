import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useCollege } from '@/context/CollegeContext';
import { collectCollegeIdScopes } from '@/lib/collegeIds';

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
    comments_count?: number;
    college_id?: string;
}

async function fetchNotices(scopes: string[]): Promise<Notice[]> {
    const normalize = (rows: any[]): Notice[] => {
        return (rows || []).map((n) => {
            const commentCount = n.comments ?? n.comments_count ?? 0;
            return {
                ...n,
                likes: n.likes || 0,
                comments: commentCount,
                comments_count: commentCount,
            };
        });
    };

    if (scopes.length === 0) return [];

    const scopedResult = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .in('college_id', scopes)
        .order('created_at', { ascending: false });

    if (scopedResult.error) throw scopedResult.error;

    const scopedRows = scopedResult.data || [];
    if (scopedRows.length > 0) return normalize(scopedRows);

    // Backward compatibility: show legacy global notices with null college_id.
    const globalResult = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .is('college_id', null)
        .order('created_at', { ascending: false });

    if (globalResult.error) return [];

    return normalize(globalResult.data || []);
}

/**
 * Custom hook for fetching notices with React Query caching.
 * Filters notices by selected college for data isolation.
 */
export function useNotices() {
    const { selectedCollegeId, selectedCollege } = useCollege();
    const queryClient = useQueryClient();
    const collegeScopes = collectCollegeIdScopes(
        selectedCollegeId,
        selectedCollege?.collegeId || null
    );
    const collegeScopeKey = collegeScopes.length > 0 ? collegeScopes.join('|') : 'none';

    const query = useQuery({
        queryKey: ['notices', collegeScopeKey],
        queryFn: () => fetchNotices(collegeScopes),
        enabled: collegeScopes.length > 0,
    });

    // Manual refresh function
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notices', collegeScopeKey] });
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
