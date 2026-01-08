import { Request, Response, NextFunction } from 'express';
import * as resourceService from '../services/resource.service';
import { logActivity, Actions } from '../services/activity.service';

/**
 * POST /api/resources
 * Create a new resource
 */
export async function createResource(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;
        const collegeId = req.userCollegeDomain || 'kiet.edu';

        const resource = await resourceService.createResource(
            req.body,
            userEmail,
            collegeId
        );

        await logActivity({
            userEmail,
            action: Actions.CREATE_RESOURCE,
            resourceType: 'resource',
            resourceId: resource.id,
            ipAddress: req.ip,
            details: { title: resource.title, type: resource.type },
        });

        res.status(201).json({
            message: 'Resource created',
            resource,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/resources/:id
 * Update a resource
 */
export async function updateResource(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.user!.email;
        const userRole = req.userRole!;

        const resource = await resourceService.updateResource(
            id,
            req.body,
            userEmail,
            userRole
        );

        await logActivity({
            userEmail,
            action: Actions.UPDATE_RESOURCE,
            resourceType: 'resource',
            resourceId: id,
            ipAddress: req.ip,
        });

        res.json({
            message: 'Resource updated',
            resource,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/resources/:id
 * Delete a resource
 */
export async function deleteResource(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.user!.email;
        const userRole = req.userRole!;

        await resourceService.deleteResource(id, userEmail, userRole);

        await logActivity({
            userEmail,
            action: Actions.DELETE_RESOURCE,
            resourceType: 'resource',
            resourceId: id,
            ipAddress: req.ip,
        });

        res.json({ message: 'Resource deleted' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/resources/mine
 * Get current user's resources
 */
export async function getMyResources(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;

        const resources = await resourceService.getUserResources(userEmail);

        res.json({ resources });
    } catch (error) {
        next(error);
    }
}
