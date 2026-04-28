import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { useCollege } from '@/context/CollegeContext';
import { collectCollegeIdScopes } from '@/lib/collegeIds';

export type Notice = api.Notice;

async function fetchNotices(scopes: string[]): Promise<Notice[]> {
    if (scopes.length === 0) return [];
    const response = await api.getNotices({ collegeId: scopes });
    return response.notices || [];
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
        selectedCollege?.collegeId || null,
        selectedCollege?.domain || null,
        selectedCollege?.name || null
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
