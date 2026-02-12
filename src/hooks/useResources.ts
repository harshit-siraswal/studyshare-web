import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useCollege } from '@/context/CollegeContext';
import { toast } from 'sonner';

export interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'notes' | 'video' | 'pyq';
    subject: string;
    chapter: string;
    semester: string;
    branch: string;
    file_url: string;
    video_url: string;
    upvotes: number;
    downvotes: number;
    votes: number;
    uploaded_by_name: string;
    uploaded_by_email: string;
    uploaded_by_role?: 'student' | 'admin' | 'teacher';
    created_at: string;
    status: string;
    college_id: string;
}

interface ResourceFilters {
    semester?: string;
    branch?: string;
    subject?: string;
}

async function fetchResources(
    collegeId: string,
    filters: ResourceFilters
): Promise<Resource[]> {
    let query = supabase
        .from('resources')
        .select('*')
        .eq('status', 'approved')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false });

    // Apply filters (skip if value is 'all')
    if (filters.semester && filters.semester !== 'all') {
        query = query.eq('semester', filters.semester);
    }
    if (filters.branch && filters.branch !== 'all') {
        query = query.eq('branch', filters.branch);
    }
    if (filters.subject && filters.subject !== 'all') {
        query = query.eq('subject', filters.subject);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to include upvotes/downvotes and calculate net votes
    return (data || []).map(resource => ({
        ...resource,
        upvotes: resource.upvotes || 0,
        downvotes: resource.downvotes || 0,
        votes: (resource.upvotes || 0) - (resource.downvotes || 0),
    }));
}

/**
 * Custom hook for fetching resources with React Query caching.
 * Replaces manual useEffect + useState pattern for better performance.
 */
export function useResources(filters: ResourceFilters) {
    const { selectedCollegeId } = useCollege();
    const queryClient = useQueryClient();
    const collegeId = selectedCollegeId;
    const collegeScope = collegeId || 'none';

    const query = useQuery({
        queryKey: ['resources', collegeScope, filters],
        queryFn: () => fetchResources(collegeId as string, filters),
        enabled: !!collegeId,
        // Error handling via meta
        meta: {
            errorMessage: 'Failed to load resources',
        },
    });

    // Handle errors with toast
    if (query.error) {
        console.error('Error fetching resources:', query.error);
        toast.error('Failed to load resources');
    }

    // Manual refresh function (invalidates cache and refetches)
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['resources', collegeScope, filters] });
        toast.success('Resources refreshed');
    };

    return {
        resources: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refresh,
        refetch: query.refetch,
    };
}

/**
 * Invalidate resources cache after mutations (create/delete/update)
 */
export function useInvalidateResources() {
    const queryClient = useQueryClient();
    const { selectedCollegeId } = useCollege();
    const collegeScope = selectedCollegeId || 'none';

    return () => {
        queryClient.invalidateQueries({ queryKey: ['resources', collegeScope] });
    };
}
