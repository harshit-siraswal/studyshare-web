import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

/**
 * User roles in ascending order of privilege
 */
export type UserRole = 'READ_ONLY' | 'COLLEGE_USER' | 'MODERATOR' | 'ADMIN';

/**
 * Role hierarchy levels for comparison
 */
const ROLE_LEVELS: Record<UserRole, number> = {
    'READ_ONLY': 1,
    'COLLEGE_USER': 2,
    'MODERATOR': 3,
    'ADMIN': 4,
};

/**
 * Extended request with role information
 */
declare global {
    namespace Express {
        interface Request {
            userRole?: UserRole;
            userCollegeDomain?: string;
        }
    }
}

/**
 * Resolve user role from database or email domain
 * 
 * Priority:
 * 1. Explicit role in user_roles table
 * 2. College domain match → COLLEGE_USER
 * 3. Default → READ_ONLY
 */
export async function resolveUserRole(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    if (!req.user?.email) {
        req.userRole = 'READ_ONLY';
        next();
        return;
    }

    const email = req.user.email;
    const emailDomain = email.split('@')[1]?.toLowerCase();

    try {
        const supabase = getSupabaseAdmin();

        // 1. Check for explicit role in database
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role, college_id')
            .eq('user_email', email)
            .single();

        if (roleData?.role) {
            req.userRole = roleData.role as UserRole;
            req.userCollegeDomain = roleData.college_id || emailDomain;
            next();
            return;
        }

        // 2. Check if email domain matches a college
        const isCollegeEmail = env.collegeDomains.includes(
            emailDomain as typeof env.collegeDomains[number]
        );

        if (isCollegeEmail) {
            req.userRole = 'COLLEGE_USER';
            req.userCollegeDomain = emailDomain;
        } else {
            req.userRole = 'READ_ONLY';
            req.userCollegeDomain = undefined;
        }

        next();
    } catch (error) {
        console.error('[RBAC] Role resolution failed:', error);
        // Default to READ_ONLY on error
        req.userRole = 'READ_ONLY';
        next();
    }
}

/**
 * Create middleware that requires a minimum role level
 * 
 * @param minRole - Minimum required role
 * @returns Express middleware
 * 
 * @example
 * router.post('/resources', verifyToken, resolveUserRole, requireRole('COLLEGE_USER'), createResource);
 */
export function requireRole(minRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userRole = req.userRole || 'READ_ONLY';
        const userLevel = ROLE_LEVELS[userRole];
        const requiredLevel = ROLE_LEVELS[minRole];

        if (userLevel < requiredLevel) {
            res.status(403).json({
                error: 'Forbidden',
                message: `This action requires ${minRole} role or higher`,
                currentRole: userRole,
            });
            return;
        }

        next();
    };
}

/**
 * Check if user has at least the specified role
 */
export function hasRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
    const userLevel = ROLE_LEVELS[userRole || 'READ_ONLY'];
    const requiredLevel = ROLE_LEVELS[minRole];
    return userLevel >= requiredLevel;
}
