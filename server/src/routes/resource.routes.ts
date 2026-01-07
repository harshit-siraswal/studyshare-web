import { Router } from 'express';
import {
    verifyToken,
    resolveUserRole,
    requireRole,
    rateLimit,
    optionalRecaptcha
} from '../middleware/index.js';
import * as resourceController from '../controllers/resource.controller.js';

const router = Router();

// All resource routes require authentication
router.use(verifyToken, resolveUserRole);

/**
 * POST /api/resources
 * Create a new resource
 * Requires: COLLEGE_USER, rate limit, optional reCAPTCHA
 */
router.post(
    '/',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    optionalRecaptcha,
    resourceController.createResource
);

/**
 * PUT /api/resources/:id
 * Update a resource
 * Requires: COLLEGE_USER (ownership checked in service)
 */
router.put(
    '/:id',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    resourceController.updateResource
);

/**
 * DELETE /api/resources/:id
 * Delete a resource
 * Requires: COLLEGE_USER (ownership checked in service)
 */
router.delete(
    '/:id',
    requireRole('COLLEGE_USER'),
    rateLimit('write'),
    resourceController.deleteResource
);

/**
 * GET /api/resources/mine
 * Get current user's resources
 */
router.get(
    '/mine',
    requireRole('COLLEGE_USER'),
    rateLimit('default'),
    resourceController.getMyResources
);

export default router;
