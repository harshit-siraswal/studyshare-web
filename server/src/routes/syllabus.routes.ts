import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit
} from '../middleware/index';
import * as syllabusController from '../controllers/syllabus.controller';

const router = Router();

// All syllabus routes require authentication and COLLEGE_USER role
router.use(verifyToken, resolveUserRole, requireRole('COLLEGE_USER'));

/**
 * POST /api/syllabus/upload-url
 * Get a signed URL for uploading syllabus PDF
 */
router.post('/upload-url', rateLimit('write'), syllabusController.getUploadUrl);

/**
 * POST /api/syllabus
 * Create a syllabus entry after file upload
 */
router.post('/', rateLimit('write'), syllabusController.createSyllabus);

/**
 * DELETE /api/syllabus/:id
 * Delete a syllabus entry
 */
router.delete('/:id', rateLimit('write'), syllabusController.deleteSyllabus);

export default router;
