import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index.js';
import * as voteController from '../controllers/vote.controller.js';

const router = Router();

// All vote routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * POST /api/votes
 * Cast or toggle a vote on a resource
 */
router.post('/', rateLimit('write'), voteController.castVote);

/**
 * GET /api/votes/:resourceId
 * Get user's vote status and counts for a resource
 */
router.get('/:resourceId', rateLimit('default'), voteController.getVoteStatus);

export default router;
