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
 * DELETE /api/bookmarks/resource/:resourceId
 * Remove bookmark by resource ID
 */
router.delete(
    '/resource/:resourceId',
    rateLimit('write'),
    bookmarkController.removeByResource
);

/**
 * GET /api/bookmarks/check/:resourceId
 * Check if a resource is bookmarked
 */
router.get(
    '/check/:resourceId',
    rateLimit('default'),
    bookmarkController.checkBookmark
);

export default router;
