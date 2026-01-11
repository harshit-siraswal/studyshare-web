import { Router } from 'express';
import { verifyAdminKey } from '../middleware/adminAuth';
import { rateLimit } from '../middleware/rateLimit';
import * as adminController from '../controllers/admin.controller';

const router = Router();

/**
 * Admin routes for user management
 * All routes require admin key authentication (key_hash from admin_keys table)
 * These endpoints are used by admin-studyspace dashboard
 * 
 * Admin dashboard sends: Authorization: Bearer ${session.key_hash}
 */

/**
 * POST /api/admin/users/ban
 * Ban a user from the platform
 * Body: { email: string, reason?: string, collegeId?: string }
 */
router.post(
    '/users/ban',
    rateLimit('write'),
    verifyAdminKey,
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
    verifyAdminKey,
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
    verifyAdminKey,
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
    verifyAdminKey,
    adminController.getBannedUsers
);

export default router;
