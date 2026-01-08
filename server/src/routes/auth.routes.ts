import { Router } from 'express';
import { verifyToken, resolveUserRole } from '../middleware/index';
import * as authController from '../controllers/auth.controller';

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
