import { Router } from 'express';
import authRoutes from './auth.routes';
import followRoutes from './follow.routes';
import bookmarkRoutes from './bookmark.routes';
import resourceRoutes from './resource.routes';
import departmentRoutes from './department.routes';
import voteRoutes from './vote.routes';
import notificationRoutes from './notification.routes';
import chatRoutes from './chat.routes';
import userRoutes from './user.routes';
import syllabusRoutes from './syllabus.routes';
import noticeRoutes from './notice.routes';
import adminRoutes from './admin.routes';

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
router.use('/notices', noticeRoutes);
router.use('/admin', adminRoutes);

export default router;
