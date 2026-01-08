import { Request, Response, NextFunction } from 'express';
import * as followService from '../services/follow.service.js';
import { logActivity, Actions } from '../services/activity.service.js';

/**
 * POST /api/follow/request
 * Send a follow request
 */
export async function sendFollowRequest(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { targetEmail } = req.body;
        const requesterEmail = req.user!.email;
        const collegeId = req.userCollegeDomain || 'kiet.edu';

        const request = await followService.createFollowRequest(
            requesterEmail,
            targetEmail,
            collegeId
        );

        await logActivity({
            userEmail: requesterEmail,
            action: Actions.SEND_FOLLOW_REQUEST,
            resourceType: 'follow_request',
            resourceId: request.id,
            ipAddress: req.ip,
            details: { targetEmail },
        });

        res.status(201).json({
            message: 'Follow request sent',
            request,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/follow/approve/:id
 * Approve a follow request
 */
export async function approveRequest(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const approverEmail = req.user!.email;

        await followService.approveFollowRequest(id, approverEmail);

        await logActivity({
            userEmail: approverEmail,
            action: Actions.APPROVE_FOLLOW,
            resourceType: 'follow_request',
            resourceId: id,
            ipAddress: req.ip,
        });

        res.json({ message: 'Follow request approved' });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/follow/reject/:id
 * Reject a follow request
 */
export async function rejectRequest(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const rejecterEmail = req.user!.email;

        await followService.rejectFollowRequest(id, rejecterEmail);

        await logActivity({
            userEmail: rejecterEmail,
            action: Actions.REJECT_FOLLOW,
            resourceType: 'follow_request',
            resourceId: id,
            ipAddress: req.ip,
        });

        res.json({ message: 'Follow request rejected' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/follow/request/:id
 * Cancel a pending follow request
 */
export async function cancelRequest(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const requesterEmail = req.user!.email;

        await followService.cancelFollowRequest(id, requesterEmail);

        res.json({ message: 'Follow request cancelled' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/follow/:targetEmail
 * Unfollow a user
 */
export async function unfollow(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { targetEmail } = req.params;
        const followerEmail = req.user!.email;

        await followService.unfollowUser(followerEmail, targetEmail);

        await logActivity({
            userEmail: followerEmail,
            action: Actions.UNFOLLOW,
            resourceType: 'follow',
            details: { targetEmail },
            ipAddress: req.ip,
        });

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/follow/pending
 * Get pending follow requests for current user
 */
export async function getPending(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;

        const requests = await followService.getPendingRequests(userEmail);

        res.json({ requests });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/follow/status/:targetEmail
 * Check if I am following target user
 */
export async function checkStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { targetEmail } = req.params;
        const followerEmail = req.user!.email;

        // Self check
        if (targetEmail === followerEmail) {
            res.json({ status: 'not-following' });
            return;
        }

        const result = await followService.getFollowStatus(followerEmail, targetEmail);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/follow/followers
 * Get users who match my followers
 */
export async function getFollowers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;
        const followers = await followService.getFollowers(userEmail);
        res.json({ followers });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/follow/following
 * Get users I follow
 */
export async function getFollowing(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;
        const following = await followService.getFollowing(userEmail);
        res.json({ following });
    } catch (error) {
        next(error);
    }
}
