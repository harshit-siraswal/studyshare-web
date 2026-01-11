import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { logActivity, Actions } from '../services/activity.service';

/**
 * POST /api/admin/users/ban
 * Ban a user (admin only)
 */
export async function banUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, reason, collegeId } = req.body;
        const adminEmail = req.user!.email;

        if (!email) {
            res.status(400).json({ message: 'User email is required' });
            return;
        }

        // Prevent self-ban
        if (email === adminEmail) {
            res.status(400).json({ message: 'Cannot ban yourself' });
            return;
        }

        const success = await userService.banUser(email, adminEmail, reason, collegeId);

        if (!success) {
            res.status(500).json({ message: 'Failed to ban user' });
            return;
        }

        await logActivity({
            userEmail: adminEmail,
            action: Actions.BAN_USER,
            resourceType: 'user',
            resourceId: email,
            ipAddress: req.ip,
            details: { bannedUser: email, reason, collegeId },
        });

        res.json({ message: 'User banned successfully', email });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/users/unban
 * Unban a user (admin only)
 */
export async function unbanUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, collegeId } = req.body;
        const adminEmail = req.user!.email;

        if (!email) {
            res.status(400).json({ message: 'User email is required' });
            return;
        }

        const success = await userService.unbanUser(email, collegeId);

        if (!success) {
            res.status(500).json({ message: 'Failed to unban user' });
            return;
        }

        await logActivity({
            userEmail: adminEmail,
            action: Actions.UNBAN_USER,
            resourceType: 'user',
            resourceId: email,
            ipAddress: req.ip,
            details: { unbannedUser: email, collegeId },
        });

        res.json({ message: 'User unbanned successfully', email });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/users/:email/banned
 * Check if a user is banned
 */
export async function checkBanned(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email } = req.params;
        const collegeId = req.query.collegeId as string | undefined;

        if (!email) {
            res.status(400).json({ message: 'User email is required' });
            return;
        }

        const isBanned = await userService.isUserBanned(email, collegeId);

        res.json({ email, isBanned, collegeId: collegeId || null });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/users/banned
 * Get all banned users (optionally filtered by college)
 */
export async function getBannedUsers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const collegeId = req.query.collegeId as string | undefined;
        const bannedUsers = await userService.getBannedUsers(collegeId);

        // Return array directly for admin-studyspace compatibility
        res.json(bannedUsers || []);
    } catch (error) {
        next(error);
    }
}
