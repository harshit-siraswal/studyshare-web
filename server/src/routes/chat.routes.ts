import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * POST /api/chat/rooms
 * Create a chat room
 */
router.post('/rooms', rateLimit('write'), chatController.createRoom);

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

export default router;
