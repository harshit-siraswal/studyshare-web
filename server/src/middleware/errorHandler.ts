import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Common error factory functions
 */
export const Errors = {
    badRequest: (message: string, details?: unknown) =>
        new ApiError(400, 'BadRequest', message, details),

    unauthorized: (message = 'Authentication required') =>
        new ApiError(401, 'Unauthorized', message),

    forbidden: (message = 'You do not have permission to perform this action') =>
        new ApiError(403, 'Forbidden', message),

    notFound: (resource = 'Resource') =>
        new ApiError(404, 'NotFound', `${resource} not found`),

    conflict: (message: string) =>
        new ApiError(409, 'Conflict', message),

    tooManyRequests: (retryAfter?: number) =>
        new ApiError(429, 'TooManyRequests', 'Rate limit exceeded', { retryAfter }),

    internal: (message = 'An unexpected error occurred') =>
        new ApiError(500, 'InternalError', message),
};

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Log error details
    console.error('[Error]', {
        name: err.name,
        message: err.message,
        stack: env.isDev ? err.stack : undefined,
        path: req.path,
        method: req.method,
        user: req.user?.email,
    });

    // Handle known API errors
    if (err instanceof ApiError) {
        const response: Record<string, unknown> = {
            error: err.code,
            message: err.message,
        };
        if (err.details) {
            response.details = err.details;
        }
        res.status(err.statusCode).json(response);
        return;
    }

    // Handle validation errors (Zod)
    if (err.name === 'ZodError') {
        res.status(400).json({
            error: 'ValidationError',
            message: 'Request validation failed',
            details: (err as any).errors,
        });
        return;
    }

    // Handle unexpected errors
    res.status(500).json({
        error: 'InternalError',
        message: env.isDev ? err.message : 'An unexpected error occurred',
    });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.path} not found`,
    });
}
