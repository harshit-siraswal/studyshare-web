import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index';
import * as chatController from '../controllers/chat.controller';

const router = Router();

// All chat routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * POST /api/chat/rooms
 * Create a chat room
 */
router.post('/rooms', chatController.createRoom); // Rate limit disabled for testing

/**
 * POST /api/chat/join
 * Join a room by code
 */
router.post('/join', rateLimit('write'), chatController.joinRoom);

/**
 * POST /api/chat/join-room
 * Join a room by ID
 */
router.post('/join-room', rateLimit('write'), chatController.joinRoomById);

/**
 * POST /api/chat/messages
 * Post a message
 */
router.post('/messages', rateLimit('write'), chatController.postMessage);

/**
 * PUT /api/chat/messages/:id/vote
 * Vote on a message
 */
router.put('/messages/:id/vote', rateLimit('write'), chatController.voteMessage);

/**
 * POST /api/chat/saved
 * Toggle save post
 */
router.post('/saved', rateLimit('write'), chatController.toggleSavePost);

/**
 * POST /api/chat/comments
 * Add a comment
 */
router.post('/comments', rateLimit('write'), chatController.addComment);

/**
 * GET /api/chat/comments/:messageId
 * Get comments for a message
 */
router.get('/comments/:messageId', rateLimit('default'), chatController.getComments);

/**
 * DELETE /api/chat/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', rateLimit('write'), chatController.deleteComment);

/**
 * GET /api/chat/rooms/:roomId/votes
 * Get user's votes for a room
 */
router.get('/rooms/:roomId/votes', rateLimit('default'), chatController.getUserVotes);

/**
 * GET /api/chat/rooms/:roomId/info
 * Get room info including membership status (public rooms accessible without joining)
 */
router.get('/rooms/:roomId/info', rateLimit('default'), chatController.getRoomInfo);

/**
 * GET /api/chat/rooms
 * Get all rooms for discovery
 */
router.get('/rooms', rateLimit('default'), chatController.getAllRooms);

export default router;
