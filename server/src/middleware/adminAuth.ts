import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase';

/**
 * Middleware to verify admin key from admin_keys table
 * Used by admin-studyspace dashboard which sends Authorization: Bearer ${key_hash}
 * 
 * This is separate from Firebase token auth - admins use key_hash for API access
 */
export async function verifyAdminKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Missing or invalid authorization header' });
            return;
        }

        const keyHash = authHeader.split('Bearer ')[1];

        if (!keyHash) {
            res.status(401).json({ message: 'No admin key provided' });
            return;
        }

        const supabase = getSupabaseAdmin();

        // Look up the key_hash in admin_keys table
        const { data: adminKey, error } = await supabase
            .from('admin_keys')
            .select('id, email, role, department, subject, created_at')
            .eq('key_hash', keyHash)
            .single();

        if (error || !adminKey) {
            console.warn('[AdminAuth] Invalid admin key attempt');
            res.status(401).json({ message: 'Invalid or expired admin key' });
            return;
        }

        // Attach admin info to request for use in controllers
        req.user = {
            email: adminKey.email,
            uid: adminKey.id,
            role: adminKey.role,
            department: adminKey.department,
            subject: adminKey.subject,
        } as any;

        console.log(`[AdminAuth] Admin authenticated: ${adminKey.email} (${adminKey.role})`);
        next();
    } catch (error) {
        console.error('[AdminAuth] Error verifying admin key:', error);
        res.status(500).json({ message: 'Authentication error' });
    }
}

/**
 * Optional admin auth - continues if no auth, but attaches admin if valid
 */
export async function optionalAdminAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const keyHash = authHeader.split('Bearer ')[1];

        if (!keyHash) {
            next();
            return;
        }

        const supabase = getSupabaseAdmin();

        const { data: adminKey } = await supabase
            .from('admin_keys')
            .select('id, email, role, department, subject')
            .eq('key_hash', keyHash)
            .single();

        if (adminKey) {
            req.user = {
                email: adminKey.email,
                uid: adminKey.id,
                role: adminKey.role,
                department: adminKey.department,
                subject: adminKey.subject,
            } as any;
        }

        next();
    } catch (error) {
        // Don't fail on optional auth
        next();
    }
}
