import { Router } from 'express';
import { verifyToken, resolveUserRole, requireRole, rateLimit, verifyRecaptcha } from '../middleware/index';
import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(verifyToken, resolveUserRole);

/**
 * GET /api/notices/:noticeId/comments
 * Get all comments for a notice
 */
router.get('/:noticeId/comments', rateLimit('default'), async (req, res, next) => {
    try {
        const { noticeId } = req.params;
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('notice_comments')
            .select('*')
            .eq('notice_id', noticeId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[NoticeComments] Fetch error:', error);
            throw Errors.internal('Failed to fetch comments');
        }

        res.json({ comments: data || [] });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notices/:noticeId/comments
 * Add a comment to a notice
 */
router.post(
    '/:noticeId/comments',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    verifyRecaptcha,
    async (req, res, next) => {
        try {
            const { noticeId } = req.params;
            const { content } = req.body;
            const userEmail = req.user!.email;
            const collegeId = req.userCollegeDomain || 'kiet.edu'; // College isolation

            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                throw Errors.badRequest('Comment content is required');
            }

            if (content.length > 500) {
                throw Errors.badRequest('Comment must be 500 characters or less');
            }

            const supabase = getSupabaseAdmin();

            // Get user name from users table
            const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('email', userEmail)
                .single();

            const { data, error } = await supabase
                .from('notice_comments')
                .insert({
                    notice_id: noticeId,
                    college_id: collegeId, // Multi-tenant isolation
                    user_email: userEmail,
                    user_name: userData?.name || userEmail.split('@')[0],
                    content: content.trim(),
                })
                .select()
                .single();

            if (error) {
                console.error('[NoticeComments] Create error:', error);
                throw Errors.internal('Failed to create comment');
            }

            res.status(201).json({ comment: data });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/notices/:noticeId/comments/:commentId
 * Delete own comment
 */
router.delete(
    '/:noticeId/comments/:commentId',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    async (req, res, next) => {
        try {
            const { noticeId, commentId } = req.params;
            const userEmail = req.user!.email;

            const supabase = getSupabaseAdmin();

            // Verify ownership
            const { data: existing } = await supabase
                .from('notice_comments')
                .select('user_email')
                .eq('id', commentId)
                .eq('notice_id', noticeId)
                .single();

            if (!existing) {
                throw Errors.notFound('Comment');
            }

            if (existing.user_email !== userEmail) {
                throw Errors.forbidden('You can only delete your own comments');
            }

            const { error } = await supabase
                .from('notice_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                console.error('[NoticeComments] Delete error:', error);
                throw Errors.internal('Failed to delete comment');
            }

            res.json({ message: 'Comment deleted' });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
