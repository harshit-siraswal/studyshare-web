import { Router } from 'express';
import { verifyToken, resolveUserRole, requireRole, rateLimit, optionalRecaptcha } from '../middleware/index';
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
    optionalRecaptcha, // Optional for authenticated users
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

/**
 * POST /api/notices/:noticeId/like
 * Toggle like on a notice
 */
router.post(
    '/:noticeId/like',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    async (req, res, next) => {
        try {
            const { noticeId } = req.params;
            const userEmail = req.user!.email;
            const collegeId = req.userCollegeDomain || 'kiet.edu';

            const supabase = getSupabaseAdmin();

            // Check if already liked
            const { data: existing } = await supabase
                .from('notice_likes')
                .select('id')
                .eq('notice_id', noticeId)
                .eq('user_email', userEmail)
                .single();

            if (existing) {
                // Unlike - remove the like
                await supabase
                    .from('notice_likes')
                    .delete()
                    .eq('id', existing.id);

                res.json({ liked: false, message: 'Like removed' });
            } else {
                // Like - add new like
                await supabase
                    .from('notice_likes')
                    .insert({
                        notice_id: noticeId,
                        user_email: userEmail,
                        college_id: collegeId,
                    });

                res.json({ liked: true, message: 'Liked' });
            }
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/notices/:noticeId/likes
 * Get like count and user's like status
 */
router.get('/:noticeId/likes', rateLimit('default'), async (req, res, next) => {
    try {
        const { noticeId } = req.params;
        const userEmail = req.user?.email;

        const supabase = getSupabaseAdmin();

        // Get total count
        const { count } = await supabase
            .from('notice_likes')
            .select('*', { count: 'exact', head: true })
            .eq('notice_id', noticeId);

        // Check if user liked
        let userLiked = false;
        if (userEmail) {
            const { data } = await supabase
                .from('notice_likes')
                .select('id')
                .eq('notice_id', noticeId)
                .eq('user_email', userEmail)
                .single();
            userLiked = !!data;
        }

        res.json({ count: count || 0, userLiked });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notices/:noticeId/comments/:commentId/like
 * Toggle like on a comment
 */
router.post(
    '/:noticeId/comments/:commentId/like',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    async (req, res, next) => {
        try {
            const { commentId } = req.params;
            const userEmail = req.user!.email;

            const supabase = getSupabaseAdmin();

            // Check if already liked
            const { data: existing } = await supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_email', userEmail)
                .single();

            if (existing) {
                // Unlike
                await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('id', existing.id);

                res.json({ liked: false, message: 'Like removed' });
            } else {
                // Like
                await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_email: userEmail,
                    });

                res.json({ liked: true, message: 'Liked' });
            }
        } catch (error) {
            next(error);
        }
    }
);

export default router;
