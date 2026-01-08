import { Request, Response, NextFunction } from 'express';
import * as bookmarkService from '../services/bookmark.service';
import { logActivity, Actions } from '../services/activity.service';

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
        const { resourceId, noticeId, itemId, type } = req.body;
        const userEmail = req.user!.email;
        const userId = req.user!.uid;

        // Support both old { resourceId } and new { itemId, type } formats
        const finalItemId = itemId || resourceId || noticeId;
        const finalType = type || (noticeId ? 'notice' : 'resource');

        if (!finalItemId) {
            res.status(400).json({ message: 'Item ID is required' });
            return;
        }

        const bookmark = await bookmarkService.addBookmark(userId, userEmail, finalItemId, finalType);

        await logActivity({
            userEmail,
            action: Actions.ADD_BOOKMARK,
            resourceType: 'bookmark',
            resourceId: bookmark.id,
            ipAddress: req.ip,
            details: { itemId: finalItemId, type: finalType },
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
 * DELETE /api/bookmarks/item/:itemId
 * Remove bookmark by Item ID
 */
export async function removeByItem(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { itemId } = req.params; // Generic param
        const userEmail = req.user!.email;

        await bookmarkService.removeBookmarkByItem(userEmail, itemId);

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/bookmarks/check/:itemId
 * Check if an item is bookmarked
 */
export async function checkBookmark(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { itemId } = req.params;
        const userEmail = req.user!.email;

        const isBookmarked = await bookmarkService.isBookmarked(userEmail, itemId);

        res.json({ isBookmarked });
    } catch (error) {
        next(error);
    }
}
