import { Router } from 'express';
import authRoutes from './auth.routes.js';
import followRoutes from './follow.routes.js';
import bookmarkRoutes from './bookmark.routes.js';
import resourceRoutes from './resource.routes.js';
import departmentRoutes from './department.routes.js';
import voteRoutes from './vote.routes.js';
import notificationRoutes from './notification.routes.js';
import chatRoutes from './chat.routes.js';
import userRoutes from './user.routes.js';
import syllabusRoutes from './syllabus.routes.js';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/follow', followRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/resources', resourceRoutes);
router.use('/departments', departmentRoutes);
router.use('/votes', voteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/syllabus', syllabusRoutes);

export default router;
