import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service.js';

/**
 * POST /api/notifications
 * Create a notification
 */
export async function createNotification(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { targetUserId, title, message, type, link } = req.body;

        if (!targetUserId || !title || !message || !type) {
            res.status(400).json({ message: 'targetUserId, title, message, and type are required' });
            return;
        }

        const notification = await notificationService.createNotification(
            targetUserId,
            title,
            message,
            type,
            link
        );

        res.status(201).json({ notification });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
export async function markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.uid;

        await notificationService.markAsRead(id, userId);

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.uid;

        await notificationService.markAllAsRead(userId);

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.uid;

        await notificationService.deleteNotification(id, userId);

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/notifications
 * Delete all notifications
 */
export async function deleteAllNotifications(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user!.uid;

        await notificationService.deleteAllNotifications(userId);

        res.json({ message: 'All notifications deleted' });
    } catch (error) {
        next(error);
    }
}
