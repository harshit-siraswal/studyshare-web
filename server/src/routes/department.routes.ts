import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    rateLimit
} from '../middleware/index';
import * as departmentController from '../controllers/department.controller';

const router = Router();

// All routes require authentication
router.use(verifyToken, resolveUserRole);

/**
 * POST /api/departments/follow
 * Follow a department
 */
router.post('/follow', rateLimit('write'), departmentController.followDepartment);

/**
 * DELETE /api/departments/follow/:id
 * Unfollow a department
 */
router.delete('/follow/:id', rateLimit('write'), departmentController.unfollowDepartment);

/**
 * GET /api/departments/following
 * Get followed departments
 */
router.get('/following', rateLimit('default'), departmentController.getFollowedDepartments);

export default router;
