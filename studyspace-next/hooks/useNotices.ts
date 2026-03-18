import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { useCollege } from '@/context/CollegeContext';
import { collectCollegeIdScopes } from '@/lib/collegeIds';

export type Notice = api.Notice;
export type NoticePagination = api.NoticePagination;

interface UseNoticesOptions {
    department?: string;
    page?: number;
    limit?: number;
}

async function fetchNotices(scopes: string[], options: Required<UseNoticesOptions>): Promise<{
    notices: Notice[];
    pagination: NoticePagination;
}> {
    if (scopes.length === 0) {
        return {
            notices: [],
            pagination: {
                page: options.page,
                limit: options.limit,
                total: 0,
                hasMore: false,
            },
        };
    }

    const response = await api.getNotices({
        collegeId: scopes,
        department: options.department,
        page: options.page,
        limit: options.limit,
    });

    return {
        notices: response.notices || [],
        pagination: response.pagination,
    };
}

/**
 * Custom hook for fetching notices with React Query caching.
 * Filters notices by selected college for data isolation and supports paginated v2 responses.
 */
export function useNotices(options: UseNoticesOptions = {}) {
    const { selectedCollegeId, selectedCollege } = useCollege();
    const queryClient = useQueryClient();
    const collegeScopes = collectCollegeIdScopes(
        selectedCollegeId,
        selectedCollege?.collegeId || null
    );
    const collegeScopeKey = collegeScopes.length > 0 ? collegeScopes.join('|') : 'none';
    const normalizedOptions: Required<UseNoticesOptions> = {
        department: options.department || '',
        page: options.page || 1,
        limit: options.limit || 20,
    };

    const query = useQuery({
        queryKey: ['notices', collegeScopeKey, normalizedOptions.department, normalizedOptions.page, normalizedOptions.limit],
        queryFn: () => fetchNotices(collegeScopes, normalizedOptions),
        enabled: collegeScopes.length > 0,
    });

    const refresh = () => {
        queryClient.invalidateQueries({
            queryKey: ['notices', collegeScopeKey, normalizedOptions.department],
        });
    };

    return {
        notices: query.data?.notices || [],
        pagination: query.data?.pagination || {
            page: normalizedOptions.page,
            limit: normalizedOptions.limit,
            total: 0,
            hasMore: false,
        },
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

