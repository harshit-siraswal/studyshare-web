import { Router } from 'express';
import { verifyToken, rateLimit } from '../middleware/index.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// All user routes require authentication
router.use(verifyToken);

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', rateLimit('default'), userController.getMyProfile);

/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', rateLimit('write'), userController.updateProfile);

export default router;
