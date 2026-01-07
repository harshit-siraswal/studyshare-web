import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// All notification routes require authentication
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * POST /api/notifications
 * Create a notification
 */
router.post('/', rateLimit('write'), notificationController.createNotification);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', rateLimit('write'), notificationController.markAllAsRead);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', rateLimit('write'), notificationController.markAsRead);

/**
 * DELETE /api/notifications
 * Delete all notifications
 */
router.delete('/', rateLimit('write'), notificationController.deleteAllNotifications);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', rateLimit('write'), notificationController.deleteNotification);

export default router;
