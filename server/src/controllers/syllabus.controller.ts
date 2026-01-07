import { Request, Response, NextFunction } from 'express';
import * as syllabusService from '../services/syllabus.service.js';

/**
 * POST /api/syllabus/upload-url
 * Get a signed URL for uploading syllabus PDF
 */
export async function getUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { filename } = req.body;

        if (!filename) {
            res.status(400).json({ message: 'filename is required' });
            return;
        }

        const result = await syllabusService.getUploadUrl(filename);

        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/syllabus
 * Create a syllabus entry after file upload
 */
export async function createSyllabus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { title, semester, branch, subject, description, pdfUrl, fileSize, collegeId } = req.body;
        const uploadedBy = req.user!.uid;

        if (!title || !semester || !branch || !subject || !pdfUrl) {
            res.status(400).json({ message: 'title, semester, branch, subject, and pdfUrl are required' });
            return;
        }

        const result = await syllabusService.createSyllabus({
            title,
            semester,
            branch,
            subject,
            description,
            pdfUrl,
            fileSize: fileSize || 0,
            uploadedBy,
            collegeId: collegeId || 'kiet.edu',
        });

        res.status(201).json({ message: 'Syllabus created', ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/syllabus/:id
 * Delete a syllabus entry
 */
export async function deleteSyllabus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.uid;

        await syllabusService.deleteSyllabus(id, userId);

        res.json({ message: 'Syllabus deleted' });
    } catch (error) {
        next(error);
    }
}
