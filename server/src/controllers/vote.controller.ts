import { Request, Response, NextFunction } from 'express';
import * as voteService from '../services/vote.service.js';

/**
 * POST /api/votes
 * Cast or toggle a vote on a resource
 */
export async function castVote(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { resourceId, voteType } = req.body;
        const userId = req.user!.uid;

        if (!resourceId || !voteType) {
            res.status(400).json({ message: 'resourceId and voteType are required' });
            return;
        }

        if (!['upvote', 'downvote'].includes(voteType)) {
            res.status(400).json({ message: 'voteType must be "upvote" or "downvote"' });
            return;
        }

        const result = await voteService.castVote(userId, resourceId, voteType);
        const counts = await voteService.getVoteCounts(resourceId);

        res.json({
            message: result.action === 'removed' ? 'Vote removed' : 'Vote recorded',
            action: result.action,
            ...counts,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/votes/:resourceId
 * Get user's vote status and counts for a resource
 */
export async function getVoteStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { resourceId } = req.params;
        const userId = req.user!.uid;

        const userVote = await voteService.getUserVote(userId, resourceId);
        const counts = await voteService.getVoteCounts(resourceId);

        res.json({
            userVote,
            ...counts,
        });
    } catch (error) {
        next(error);
    }
}
