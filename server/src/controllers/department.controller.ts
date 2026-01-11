import { Request, Response, NextFunction } from 'express';
import * as departmentService from '../services/department.service';
import { logActivity, Actions } from '../services/activity.service';

export async function followDepartment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id, collegeId } = req.body; // Expecting { id: 'cse', collegeId: 'kiet.edu' }
        const userEmail = req.user!.email;

        if (!id) {
            res.status(400).json({ message: 'Department ID is required' });
            return;
        }

        if (!collegeId) {
            res.status(400).json({ message: 'College ID is required for data isolation' });
            return;
        }

        await departmentService.followDepartment(userEmail, id, collegeId);

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
        const collegeId = req.query.collegeId as string || 'kiet.edu';
        const userEmail = req.user!.email;

        await departmentService.unfollowDepartment(userEmail, id, collegeId);

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
        const collegeId = req.query.collegeId as string || 'kiet.edu';

        const departments = await departmentService.getFollowedDepartments(userEmail, collegeId);
        res.json({ departments });
    } catch (error) {
        next(error);
    }
}
