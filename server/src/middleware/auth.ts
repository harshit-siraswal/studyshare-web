import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';

/**
 * User context attached to requests after authentication
 */
export interface AuthUser {
    uid: string;
    email: string;
    emailVerified: boolean;
}

/**
 * Extend Express Request to include authenticated user
 */
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

/**
 * Middleware to verify Firebase ID tokens
 * 
 * Expected header: Authorization: Bearer <firebase_id_token>
 * 
 * On success: attaches user info to req.user
 * On failure: returns 401 Unauthorized
 */
export async function verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header'
        });
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const auth = getFirebaseAuth();
        const decoded = await auth.verifyIdToken(token);

        if (!decoded.email) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token does not contain email claim'
            });
            return;
        }

        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            emailVerified: decoded.email_verified ?? false,
        };

        next();
    } catch (error: any) {
        console.error('[Auth] Token verification failed:', error.code || error.message);

        // Provide specific error messages for common cases
        if (error.code === 'auth/id-token-expired') {
            res.status(401).json({
                error: 'TokenExpired',
                message: 'Firebase token has expired. Please refresh.'
            });
            return;
        }

        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid Firebase token'
        });
    }
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for endpoints that work for both guests and authenticated users
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const auth = getFirebaseAuth();
        const decoded = await auth.verifyIdToken(token);

        if (decoded.email) {
            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                emailVerified: decoded.email_verified ?? false,
            };
        }
    } catch {
        // Silently ignore invalid tokens for optional auth
    }

    next();
}
