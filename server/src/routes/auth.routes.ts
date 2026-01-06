import { Router } from 'express';
import { verifyToken, resolveUserRole } from '../middleware/index.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /api/auth/verify
 * Verify Firebase token and return user info
 */
router.post('/verify', verifyToken, resolveUserRole, authController.verifyTokenEndpoint);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', verifyToken, resolveUserRole, authController.getMe);

export default router;
