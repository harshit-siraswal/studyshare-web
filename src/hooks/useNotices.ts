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
    comments_count?: number;
    college_id?: string;
}

async function fetchNotices(collegeId: string): Promise<Notice[]> {
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

    const queryByScope = async (scope: string) => {
        return supabase
            .from('notices')
            .select('*')
            .eq('is_active', true)
            .eq('college_id', scope)
            .order('created_at', { ascending: false });
    };

    // Primary scope: selected college ID
    const primaryResult = await queryByScope(collegeId);
    if (primaryResult.error) throw primaryResult.error;

    return normalize(primaryResult.data || []);
}

/**
 * Custom hook for fetching notices with React Query caching.
 * Filters notices by selected college for data isolation.
 */
export function useNotices() {
    const { selectedCollegeId, selectedCollege } = useCollege();
    const queryClient = useQueryClient();
    const collegeId = selectedCollegeId;
    const collegeDomain = selectedCollege?.domain || null;
    const collegeScope = collegeId || collegeDomain || 'none';

    const query = useQuery({
        queryKey: ['notices', collegeScope],
        queryFn: async () => {
            if (collegeId) {
                const scoped = await fetchNotices(collegeId);
                if (scoped.length > 0 || !collegeDomain || collegeDomain === collegeId) {
                    return scoped;
                }

                // Backward compatibility: some notice rows may still store college domain.
                const legacyScoped = await supabase
                    .from('notices')
                    .select('*')
                    .eq('is_active', true)
                    .eq('college_id', collegeDomain)
                    .order('created_at', { ascending: false });

                if (legacyScoped.error) {
                    return scoped;
                }

                return (legacyScoped.data || []).map((n) => {
                    const commentCount = n.comments ?? n.comments_count ?? 0;
                    return {
                        ...n,
                        likes: n.likes || 0,
                        comments: commentCount,
                        comments_count: commentCount,
                    };
                });
            }

            if (!collegeDomain) return [];
            const legacyScoped = await supabase
                .from('notices')
                .select('*')
                .eq('is_active', true)
                .eq('college_id', collegeDomain)
                .order('created_at', { ascending: false });

            if (legacyScoped.error) throw legacyScoped.error;

            return (legacyScoped.data || []).map((n) => {
                const commentCount = n.comments ?? n.comments_count ?? 0;
                return {
                    ...n,
                    likes: n.likes || 0,
                    comments: commentCount,
                    comments_count: commentCount,
                };
            });
        },
        enabled: !!collegeId || !!collegeDomain,
    });

    // Manual refresh function
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notices', collegeScope] });
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
