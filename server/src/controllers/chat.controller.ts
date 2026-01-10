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
        const { direction } = req.body;
        const userEmail = req.user!.email;

        if (!['up', 'down'].includes(direction)) {
            res.status(400).json({ message: 'direction must be "up" or "down"' });
            return;
        }

        const result = await chatService.voteMessage(id, userEmail, direction);

        res.json({ message: 'Vote recorded', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/chat/rooms/:roomId/votes
 * Get user's votes for a room
 */
export async function getUserVotes(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const userEmail = req.user!.email;

        const votes = await chatService.getUserVotes(roomId, userEmail);

        res.json({ votes });
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
        const { messageId, content, parentId } = req.body;
        const userEmail = req.user!.email;
        const userName = req.body.authorName || userEmail.split('@')[0];

        if (!messageId || !content) {
            res.status(400).json({ message: 'messageId and content are required' });
            return;
        }

        const result = await chatService.addComment(messageId, userName, userEmail, content, parentId);

        res.status(201).json({ message: 'Comment added', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/chat/comments/:messageId
 * Get comments for a message
 */
export async function getComments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            res.status(400).json({ message: 'messageId is required' });
            return;
        }

        const result = await chatService.getComments(messageId);

        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/chat/comments/:commentId
 * Delete a comment
 */
export async function deleteComment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { commentId } = req.params;
        const userEmail = req.user!.email;

        if (!commentId) {
            res.status(400).json({ message: 'commentId is required' });
            return;
        }

        await chatService.deleteComment(commentId, userEmail);

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/chat/rooms/:roomId/info
 * Get room info including membership status
 */
export async function getRoomInfo(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const userEmail = req.user?.email;

        if (!roomId) {
            res.status(400).json({ message: 'roomId is required' });
            return;
        }

        const result = await chatService.getRoomInfo(roomId, userEmail);

        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/chat/rooms
 * Get all rooms for discovery
 */
export async function getAllRooms(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const collegeId = req.query.collegeId as string || 'kiet.edu';

        const result = await chatService.getAllRooms(collegeId);

        res.json(result);
    } catch (error) {
        next(error);
    }
}

// ========================================
// ROOM SETTINGS CONTROLLERS
// ========================================

/**
 * POST /api/chat/rooms/:roomId/mute
 * Toggle mute notifications
 */
export async function toggleMuteNotifications(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const { muted } = req.body;
        const userEmail = req.user!.email;

        await chatService.toggleMuteNotifications(roomId, userEmail, muted === true);

        res.json({ message: muted ? 'Notifications muted' : 'Notifications unmuted' });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/rooms/:roomId/regenerate-code
 * Regenerate room code (admin only)
 */
export async function regenerateRoomCode(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const adminEmail = req.user!.email;

        const result = await chatService.regenerateRoomCode(roomId, adminEmail);

        res.json({ message: 'Code regenerated', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/rooms/:roomId/ban
 * Ban a member (admin only)
 */
export async function banMember(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const { targetEmail } = req.body;
        const adminEmail = req.user!.email;

        if (!targetEmail) {
            res.status(400).json({ message: 'targetEmail is required' });
            return;
        }

        await chatService.banMember(roomId, adminEmail, targetEmail);

        res.json({ message: 'Member banned' });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/chat/rooms/:roomId/unban
 * Unban a member (admin only)
 */
export async function unbanMember(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const { targetEmail } = req.body;
        const adminEmail = req.user!.email;

        if (!targetEmail) {
            res.status(400).json({ message: 'targetEmail is required' });
            return;
        }

        await chatService.unbanMember(roomId, adminEmail, targetEmail);

        res.json({ message: 'Member unbanned' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/chat/rooms/:roomId
 * Delete a room (admin only)
 */
export async function deleteRoom(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;
        const adminEmail = req.user!.email;

        await chatService.deleteRoom(roomId, adminEmail);

        res.json({ message: 'Room deleted' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/chat/rooms/:roomId/members
 * Get room members list
 */
export async function getRoomMembers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { roomId } = req.params;

        const members = await chatService.getRoomMembers(roomId);

        res.json({ members });
    } catch (error) {
        next(error);
    }
}

