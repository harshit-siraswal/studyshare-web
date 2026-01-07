import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

/**
 * GET /api/users/profile
 * Get current user profile
 */
export async function getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const uid = req.user!.uid;
        const profile = await userService.getUserProfileById(uid);

        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }

        res.json({ profile });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/profile
 * Update current user profile
 */
export async function updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const uid = req.user!.uid;
        const updates = req.body;

        // Whitelist allowed fields
        const allowedUpdates: Record<string, any> = {};
        const allowedFields = ['display_name', 'username', 'bio', 'profile_photo_url', 'college', 'branch', 'semester'];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                allowedUpdates[field] = updates[field];
            }
        }

        const updatedProfile = await userService.updateUserProfile(uid, allowedUpdates);

        res.json({ message: 'Profile updated', profile: updatedProfile });
    } catch (error) {
        next(error);
    }
}
