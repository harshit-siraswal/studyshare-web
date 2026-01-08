import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';

/**
 * POST /api/chat/rooms
 * Create a chat room
 */
export async function createRoom(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, description, isPrivate, collegeId } = req.body;
        const createdBy = req.user!.email;

        if (!name) {
            res.status(400).json({ message: 'name is required' });
            return;
        }

        const result = await chatService.createRoom(
            name,
            description || null,
            isPrivate ?? false,
            createdBy,
            collegeId || 'kiet.edu'
        );

        res.status(201).json({ message: 'Room created', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/join
 * Join a room by code
 */
export async function joinRoom(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { joinCode, collegeId } = req.body;
        const userEmail = req.user!.email;

        if (!joinCode) {
            res.status(400).json({ message: 'joinCode is required' });
            return;
        }

        const result = await chatService.joinRoomByCode(
            joinCode,
            userEmail,
            collegeId || 'kiet.edu'
        );

        res.json({ message: 'Joined room', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/join-room
 * Join a room by ID (after password verification on client)
 */
export async function joinRoomById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId, collegeId } = req.body;
        const userEmail = req.user!.email;
        const userName = req.body.userName || userEmail.split('@')[0];

        if (!roomId) {
            res.status(400).json({ message: 'roomId is required' });
            return;
        }

        const result = await chatService.joinRoomById(
            roomId,
            userEmail,
            userName,
            collegeId || 'kiet.edu'
        );

        res.json({ message: 'Joined room', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/messages
 * Post a message to a room
 */
export async function postMessage(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId, content, imageUrl } = req.body;
        const userEmail = req.user!.email;
        const userName = req.body.authorName || userEmail.split('@')[0];

        if (!roomId) {
            res.status(400).json({ message: 'roomId is required' });
            return;
        }

        if (!content && !imageUrl) {
            res.status(400).json({ message: 'content or imageUrl is required' });
            return;
        }

        const result = await chatService.postMessage(
            roomId,
            userName,
            userEmail,
            content || '',
            imageUrl
        );

        res.status(201).json({ message: 'Posted', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/chat/messages/:id/vote
 * Vote on a message
 */
export async function voteMessage(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { direction, delta } = req.body;

        if (!['up', 'down'].includes(direction)) {
            res.status(400).json({ message: 'direction must be "up" or "down"' });
            return;
        }

        await chatService.voteMessage(id, direction, delta ?? 1);

        res.json({ message: 'Vote recorded' });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/saved
 * Toggle save post
 */
export async function toggleSavePost(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { messageId, roomId } = req.body;
        const userEmail = req.user!.email;

        if (!messageId || !roomId) {
            res.status(400).json({ message: 'messageId and roomId are required' });
            return;
        }

        const result = await chatService.toggleSavePost(userEmail, messageId, roomId);

        res.json({ message: result.saved ? 'Post saved' : 'Post unsaved', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/comments
 * Add a comment
 */
export async function addComment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { messageId, content } = req.body;
        const userEmail = req.user!.email;
        const userName = req.body.authorName || userEmail.split('@')[0];

        if (!messageId || !content) {
            res.status(400).json({ message: 'messageId and content are required' });
            return;
        }

        const result = await chatService.addComment(messageId, userName, userEmail, content);

        res.status(201).json({ message: 'Comment added', ...result });
    } catch (error) {
        next(error);
    }
}
