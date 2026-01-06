import { Router } from 'express';
import authRoutes from './auth.routes.js';
import followRoutes from './follow.routes.js';
import bookmarkRoutes from './bookmark.routes.js';
import resourceRoutes from './resource.routes.js';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/follow', followRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/resources', resourceRoutes);

export default router;
