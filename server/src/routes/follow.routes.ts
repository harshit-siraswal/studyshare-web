import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit,
    verifyRecaptcha
} from '../middleware/index.js';
import * as followController from '../controllers/follow.controller.js';

const router = Router();

// All follow routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole);

/**
 * POST /api/follow/request
 * Send a follow request
 * Requires: COLLEGE_USER, reCAPTCHA
 */
router.post(
    '/request',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    verifyRecaptcha,
    followController.sendFollowRequest
);

/**
 * POST /api/follow/approve/:id
 * Approve a follow request
 * Requires: COLLEGE_USER (owner check in service)
 */
router.post(
    '/approve/:id',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    followController.approveRequest
);

/**
 * POST /api/follow/reject/:id
 * Reject a follow request
 */
router.post(
    '/reject/:id',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    followController.rejectRequest
);

/**
 * DELETE /api/follow/request/:id
 * Cancel a pending follow request
 */
router.delete(
    '/request/:id',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    followController.cancelRequest
);

/**
 * DELETE /api/follow/:targetEmail
 * Unfollow a user
 */
router.delete(
    '/:targetEmail',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    followController.unfollow
);

/**
 * GET /api/follow/pending
 * Get pending follow requests for current user
 */
router.get(
    '/pending',
    requireRole('COLLEGE_USER'),
    rateLimit('default'),
    followController.getPending
);

/**
 * GET /api/follow/status/:targetEmail
 * Check if I am following target user
 */
router.get(
    '/status/:targetEmail',
    rateLimit('default'),
    followController.checkStatus
);

/**
 * GET /api/follow/followers
 * Get my followers
 */
router.get(
    '/followers',
    rateLimit('default'),
    followController.getFollowers
);

/**
 * GET /api/follow/following
 * Get people I follow
 */
router.get(
    '/following',
    rateLimit('default'),
    followController.getFollowing
);

export default router;
