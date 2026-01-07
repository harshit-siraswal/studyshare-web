import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index.js';
import * as bookmarkController from '../controllers/bookmark.controller.js';

const router = Router();

// All bookmark routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * GET /api/bookmarks
 * Get all bookmarks for current user
 */
router.get('/', rateLimit('default'), bookmarkController.getBookmarks);

/**
 * POST /api/bookmarks
 * Add a bookmark
 */
router.post('/', rateLimit('write'), bookmarkController.addBookmark);

/**
 * DELETE /api/bookmarks/:id
 * Remove a bookmark by ID
 */
router.delete('/:id', rateLimit('write'), bookmarkController.removeBookmark);

/**
 * DELETE /api/bookmarks/item/:itemId
 * Remove bookmark by Item ID (Notice or Resource)
 */
router.delete(
    '/item/:itemId',
    rateLimit('write'),
    bookmarkController.removeByItem
);

/**
 * DELETE /api/bookmarks/resource/:resourceId
 * Legacy endpoint support (mapped to generic handler)
 */
router.delete(
    '/resource/:itemId',
    rateLimit('write'),
    bookmarkController.removeByItem
);

/**
 * GET /api/bookmarks/check/:itemId
 * Check if an item is bookmarked
 */
router.get(
    '/check/:itemId',
    rateLimit('default'),
    bookmarkController.checkBookmark
);

export default router;
