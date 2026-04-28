import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCollege } from '@/context/CollegeContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { listResources as listResourcesApi, type Resource as ApiResource } from '@/lib/api';

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
    primaryScope?: ApiResource['primaryScope'];
    scopes?: ApiResource['scopes'];
    contributorsCount?: number;
    isContributor?: boolean;
    autoLinkedScopeCount?: number;
}

interface ResourceFilters {
    semester?: string;
    branch?: string;
    subject?: string;
}

async function fetchResources(
    collegeScope: string,
    filters: ResourceFilters
): Promise<Resource[]> {
    const result = await listResourcesApi({
        collegeId: collegeScope,
        college: collegeScope,
        semester: filters.semester,
        branch: filters.branch,
        subject: filters.subject,
        limit: 200,
    });

    return (result.resources || []).map((resource) => {
        const semester = resource.primaryScope?.semester || resource.semester || '';
        const branch = resource.primaryScope?.branch || resource.branch || '';
        const subject = resource.primaryScope?.subject || resource.subject || '';
        const fileUrl = resource.file_url || resource.filePath || '';
        const videoUrl = resource.video_url || resource.url || '';
        const createdAt = resource.createdAt || resource.created_at || '';
        const uploadedByEmail = resource.uploadedByEmail || resource.uploaded_by_email || '';
        return {
            id: resource.id,
            title: resource.title,
            description: resource.description || '',
            type: resource.type as Resource['type'],
            subject,
            chapter: resource.chapter || '',
            semester,
            branch,
            file_url: fileUrl,
            video_url: videoUrl,
            upvotes: resource.upvotes || 0,
            downvotes: resource.downvotes || 0,
            votes: (resource.upvotes || 0) - (resource.downvotes || 0),
            uploaded_by_name: resource.uploadedByName || resource.uploaded_by_name || '',
            uploaded_by_email: uploadedByEmail,
            created_at: createdAt,
            status: resource.status || (resource.isApproved ? 'approved' : 'pending'),
            college_id: resource.collegeId || resource.college_id || collegeScope,
            primaryScope: resource.primaryScope,
            scopes: resource.scopes,
            contributorsCount: resource.contributorsCount,
            isContributor: resource.isContributor,
            autoLinkedScopeCount: resource.autoLinkedScopeCount,
        };
    });
}

/**
 * Custom hook for fetching resources with React Query caching.
 * Replaces manual useEffect + useState pattern for better performance.
 */
export function useResources(filters: ResourceFilters) {
    const { selectedCollegeId, selectedCollege } = useCollege();
    const { user, loading } = useAuth();
    const queryClient = useQueryClient();
    const collegeScope =
        selectedCollegeId ||
        selectedCollege?.domain ||
        selectedCollege?.name ||
        '';
    const queryScopeKey = collegeScope || 'none';
    const userScope = user?.uid || 'guest';

    const query = useQuery({
        queryKey: ['resources', queryScopeKey, userScope, filters],
        queryFn: () => fetchResources(collegeScope, filters),
        enabled: !!collegeScope && !!user && !loading,
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
        queryClient.invalidateQueries({ queryKey: ['resources', queryScopeKey, userScope] });
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
    const { selectedCollegeId, selectedCollege } = useCollege();
    const collegeScope =
        selectedCollegeId ||
        selectedCollege?.domain ||
        selectedCollege?.name ||
        'none';

    return () => {
        queryClient.invalidateQueries({ queryKey: ['resources', collegeScope] });
    };
}
