import { Request, Response, NextFunction } from 'express';
import * as departmentService from '../services/department.service.js';
import { logActivity, Actions } from '../services/activity.service.js';

export async function followDepartment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.body; // Expecting { id: 'cse' }
        const userEmail = req.user!.email;

        if (!id) {
            res.status(400).json({ message: 'Department ID is required' });
            return;
        }

        await departmentService.followDepartment(userEmail, id);

        await logActivity({
            userEmail,
            action: 'FOLLOW_DEPARTMENT',
            resourceType: 'department',
            resourceId: id,
            ipAddress: req.ip
        });

        res.json({ message: 'Following department' });
    } catch (error) {
        next(error);
    }
}

export async function unfollowDepartment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.user!.email;

        await departmentService.unfollowDepartment(userEmail, id);

        res.json({ message: 'Unfollowed department' });
    } catch (error) {
        next(error);
    }
}

export async function getFollowedDepartments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;
        const departments = await departmentService.getFollowedDepartments(userEmail);
        res.json({ departments });
    } catch (error) {
        next(error);
    }
}
