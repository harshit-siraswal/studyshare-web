import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import * as adminController from '../controllers/admin.controller';

const router = Router();

/**
 * Admin routes for user management
 * All routes require authentication
 * These endpoints are used by admin-studyspace dashboard
 */

/**
 * POST /api/admin/users/ban
 * Ban a user from the platform
 * Body: { email: string, reason?: string, collegeId?: string }
 */
router.post(
    '/users/ban',
    rateLimit('write'),
    verifyToken,
    adminController.banUser
);

/**
 * POST /api/admin/users/unban
 * Unban a previously banned user
 * Body: { email: string, collegeId?: string }
 */
router.post(
    '/users/unban',
    rateLimit('write'),
    verifyToken,
    adminController.unbanUser
);

/**
 * GET /api/admin/users/:email/banned
 * Check if a specific user is banned
 * Query: ?collegeId=xxx (optional)
 */
router.get(
    '/users/:email/banned',
    rateLimit('default'),
    verifyToken,
    adminController.checkBanned
);

/**
 * GET /api/admin/users/banned
 * Get list of all banned users
 * Query: ?collegeId=xxx (optional filter)
 */
router.get(
    '/users/banned',
    rateLimit('default'),
    verifyToken,
    adminController.getBannedUsers
);

export default router;
