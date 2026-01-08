import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

export interface SyllabusUploadData {
    title: string;
    semester: string;
    branch: string;
    subject: string;
    description?: string;
    pdfUrl: string;
    fileSize: number;
    uploadedBy: string;
    collegeId: string;
}

/**
 * Create a syllabus entry
 */
export async function createSyllabus(data: SyllabusUploadData): Promise<{ id: string }> {
    const supabase = getSupabaseAdmin();

    const { data: syllabus, error } = await supabase
        .from('syllabus')
        .insert({
            title: data.title,
            semester: data.semester,
            branch: data.branch,
            subject: data.subject,
            description: data.description || null,
            pdf_url: data.pdfUrl,
            file_size: data.fileSize,
            uploaded_by: data.uploadedBy,
            college_id: data.collegeId,
        })
        .select('id')
        .single();

    if (error) {
        console.error('[SyllabusService] Create error:', error);
        throw Errors.internal('Failed to create syllabus entry');
    }

    return { id: syllabus.id };
}

/**
 * Generate a signed upload URL for syllabus PDF
 */
export async function getUploadUrl(
    filename: string
): Promise<{ signedUrl: string; path: string }> {
    const supabase = getSupabaseAdmin();

    const path = `${Date.now()}-${filename}`;

    const { data, error } = await supabase.storage
        .from('syllabus-pdfs')
        .createSignedUploadUrl(path);

    if (error) {
        console.error('[SyllabusService] Signed URL error:', error);
        throw Errors.internal('Failed to generate upload URL');
    }

    return { signedUrl: data.signedUrl, path };
}

/**
 * Get public URL for a syllabus PDF
 */
export async function getPublicUrl(path: string): Promise<string> {
    const supabase = getSupabaseAdmin();

    const { data } = supabase.storage
        .from('syllabus-pdfs')
        .getPublicUrl(path);

    return data.publicUrl;
}

/**
 * Delete a syllabus entry (admin only)
 */
export async function deleteSyllabus(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get syllabus to check ownership and get file path
    const { data: syllabus, error: fetchError } = await supabase
        .from('syllabus')
        .select('id, pdf_url, uploaded_by')
        .eq('id', id)
        .single();

    if (fetchError || !syllabus) {
        throw Errors.notFound('Syllabus');
    }

    // Check ownership (or could check admin role)
    if (syllabus.uploaded_by !== userId) {
        throw Errors.forbidden('You can only delete your own syllabus uploads');
    }

    // Delete from database
    const { error: deleteError } = await supabase
        .from('syllabus')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('[SyllabusService] Delete error:', deleteError);
        throw Errors.internal('Failed to delete syllabus');
    }
}
