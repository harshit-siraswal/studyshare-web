import { Request, Response, NextFunction } from 'express';
import * as bookmarkService from '../services/bookmark.service.js';
import { logActivity, Actions } from '../services/activity.service.js';

/**
 * GET /api/bookmarks
 * Get all bookmarks for current user
 */
export async function getBookmarks(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userEmail = req.user!.email;

        const bookmarks = await bookmarkService.getUserBookmarks(userEmail);

        res.json({ bookmarks });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/bookmarks
 * Add a bookmark
 */
export async function addBookmark(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { resourceId } = req.body;
        const userEmail = req.user!.email;

        const bookmark = await bookmarkService.addBookmark(userEmail, resourceId);

        await logActivity({
            userEmail,
            action: Actions.ADD_BOOKMARK,
            resourceType: 'bookmark',
            resourceId: bookmark.id,
            ipAddress: req.ip,
            details: { resourceId },
        });

        res.status(201).json({
            message: 'Bookmark added',
            bookmark,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/bookmarks/:id
 * Remove a bookmark by ID
 */
export async function removeBookmark(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userEmail = req.user!.email;

        await bookmarkService.removeBookmark(userEmail, id);

        await logActivity({
            userEmail,
            action: Actions.REMOVE_BOOKMARK,
            resourceType: 'bookmark',
            resourceId: id,
            ipAddress: req.ip,
        });

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/bookmarks/resource/:resourceId
 * Remove bookmark by resource ID
 */
export async function removeByResource(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { resourceId } = req.params;
        const userEmail = req.user!.email;

        await bookmarkService.removeBookmarkByResource(userEmail, resourceId);

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/bookmarks/check/:resourceId
 * Check if a resource is bookmarked
 */
export async function checkBookmark(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { resourceId } = req.params;
        const userEmail = req.user!.email;

        const isBookmarked = await bookmarkService.isBookmarked(userEmail, resourceId);

        res.json({ isBookmarked });
    } catch (error) {
        next(error);
    }
}
