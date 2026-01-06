import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import { hasRole, UserRole } from '../middleware/rbac.js';

export interface Resource {
    id: string;
    title: string;
    type: string;
    description?: string;
    url?: string;
    filePath?: string;
    branch?: string;
    semester?: string;
    subject?: string;
    uploadedByEmail: string;
    collegeId: string;
    upvotes: number;
    downvotes: number;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateResourceInput {
    title: string;
    type: string;
    description?: string;
    url?: string;
    filePath?: string;
    branch?: string;
    semester?: string;
    subject?: string;
}

/**
 * Create a new resource
 */
export async function createResource(
    input: CreateResourceInput,
    userEmail: string,
    collegeId: string
): Promise<Resource> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('resources')
        .insert({
            title: input.title,
            type: input.type,
            description: input.description,
            url: input.url,
            file_path: input.filePath,
            branch: input.branch,
            semester: input.semester,
            subject: input.subject,
            uploaded_by_email: userEmail,
            college_id: collegeId,
            is_approved: true, // Auto-approve for now
            upvotes: 0,
            downvotes: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('[ResourceService] Create error:', error);
        throw Errors.internal('Failed to create resource');
    }

    return mapResource(data);
}

/**
 * Update a resource (owner or moderator+)
 */
export async function updateResource(
    resourceId: string,
    updates: Partial<CreateResourceInput>,
    userEmail: string,
    userRole: UserRole
): Promise<Resource> {
    const supabase = getSupabaseAdmin();

    // Get existing resource
    const { data: existing, error: fetchError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

    if (fetchError || !existing) {
        throw Errors.notFound('Resource');
    }

    // Check ownership or moderator role
    const isOwner = existing.uploaded_by_email === userEmail;
    const isModerator = hasRole(userRole, 'MODERATOR');

    if (!isOwner && !isModerator) {
        throw Errors.forbidden('You can only edit your own resources');
    }

    const { data, error } = await supabase
        .from('resources')
        .update({
            title: updates.title,
            type: updates.type,
            description: updates.description,
            url: updates.url,
            file_path: updates.filePath,
            branch: updates.branch,
            semester: updates.semester,
            subject: updates.subject,
            updated_at: new Date().toISOString(),
        })
        .eq('id', resourceId)
        .select()
        .single();

    if (error) {
        console.error('[ResourceService] Update error:', error);
        throw Errors.internal('Failed to update resource');
    }

    return mapResource(data);
}

/**
 * Delete a resource (owner or moderator+)
 */
export async function deleteResource(
    resourceId: string,
    userEmail: string,
    userRole: UserRole
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get existing resource
    const { data: existing, error: fetchError } = await supabase
        .from('resources')
        .select('uploaded_by_email')
        .eq('id', resourceId)
        .single();

    if (fetchError || !existing) {
        throw Errors.notFound('Resource');
    }

    // Check ownership or moderator role
    const isOwner = existing.uploaded_by_email === userEmail;
    const isModerator = hasRole(userRole, 'MODERATOR');

    if (!isOwner && !isModerator) {
        throw Errors.forbidden('You can only delete your own resources');
    }

    const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

    if (error) {
        console.error('[ResourceService] Delete error:', error);
        throw Errors.internal('Failed to delete resource');
    }
}

/**
 * Get user's own resources
 */
export async function getUserResources(userEmail: string): Promise<Resource[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by_email', userEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ResourceService] Fetch error:', error);
        throw Errors.internal('Failed to fetch resources');
    }

    return (data || []).map(mapResource);
}

/**
 * Map database row to Resource interface
 */
function mapResource(row: any): Resource {
    return {
        id: row.id,
        title: row.title,
        type: row.type,
        description: row.description,
        url: row.url,
        filePath: row.file_path,
        branch: row.branch,
        semester: row.semester,
        subject: row.subject,
        uploadedByEmail: row.uploaded_by_email,
        collegeId: row.college_id,
        upvotes: row.upvotes || 0,
        downvotes: row.downvotes || 0,
        isApproved: row.is_approved ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
