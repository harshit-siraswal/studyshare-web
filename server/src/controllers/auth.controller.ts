import { Request, Response, NextFunction } from 'express';
import { getUserInfo } from '../services/auth.service';
import { isUserBanned, getBanInfo } from '../services/user.service';

/**
 * GET /api/auth/me
 * Get current user info including role
 */
export async function getMe(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.email) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const userInfo = await getUserInfo(req.user.email);

        // Check ban status
        const banInfo = await getBanInfo(req.user.email);

        res.json({
            uid: req.user.uid,
            ...userInfo,
            isBanned: banInfo.isBanned,
            banReason: banInfo.reason,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/verify
 * Verify a Firebase token and return user info
 * This endpoint is protected by verifyToken middleware
 */
export async function verifyTokenEndpoint(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.email) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        const userInfo = await getUserInfo(req.user.email);

        // Check ban status - this is critical for blocking banned users
        const banInfo = await getBanInfo(req.user.email);

        res.json({
            valid: true,
            uid: req.user.uid,
            ...userInfo,
            isBanned: banInfo.isBanned,
            banReason: banInfo.reason,
        });
    } catch (error) {
        next(error);
    }
}
