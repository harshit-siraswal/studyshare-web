import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * reCAPTCHA verification result attached to request
 */
export interface RecaptchaResult {
    success: boolean;
    score: number;
    action?: string;
    challengeTimestamp?: string;
    hostname?: string;
}

declare global {
    namespace Express {
        interface Request {
            recaptcha?: RecaptchaResult;
        }
    }
}

/**
 * Track failed reCAPTCHA attempts for cooldown
 */
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const COOLDOWN_THRESHOLD = 5;
const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get client IP for tracking
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ips.trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Check if client is in cooldown period after too many failed attempts
 */
function isInCooldown(ip: string): boolean {
    const entry = failedAttempts.get(ip);
    if (!entry) return false;

    const now = Date.now();
    if (entry.count >= COOLDOWN_THRESHOLD) {
        if (now - entry.lastAttempt < COOLDOWN_DURATION) {
            return true;
        }
        // Cooldown expired, reset
        failedAttempts.delete(ip);
    }
    return false;
}

/**
 * Track a failed reCAPTCHA attempt
 */
function trackFailure(ip: string): void {
    const now = Date.now();
    const entry = failedAttempts.get(ip);

    if (entry) {
        entry.count++;
        entry.lastAttempt = now;
    } else {
        failedAttempts.set(ip, { count: 1, lastAttempt: now });
    }
}

/**
 * Middleware to verify reCAPTCHA v3 tokens server-side
 * 
 * Expects: { recaptchaToken: string } in request body
 * 
 * Uses score-based verification (not just "exists → allow")
 * Implements cooldown for repeated failures
 */
export async function verifyRecaptcha(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Skip in development if no secret configured
    if (env.isDev && !env.recaptcha.secretKey) {
        console.warn('[reCAPTCHA] Skipping verification in dev mode (no secret key)');
        req.recaptcha = { success: true, score: 1.0 };
        next();
        return;
    }

    const ip = getClientIp(req);

    // Check for cooldown
    if (isInCooldown(ip)) {
        res.status(429).json({
            error: 'TooManyFailedAttempts',
            message: 'Too many failed reCAPTCHA attempts. Please try again in 15 minutes.',
        });
        return;
    }

    const token = req.body?.recaptchaToken;

    if (!token) {
        res.status(400).json({
            error: 'BadRequest',
            message: 'reCAPTCHA token is required',
        });
        return;
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: env.recaptcha.secretKey,
                response: token,
                remoteip: ip,
            }),
        });

        const data = await response.json() as RecaptchaResult & {
            'error-codes'?: string[];
        };

        if (!data.success) {
            console.warn('[reCAPTCHA] Verification failed:', data['error-codes']);
            trackFailure(ip);

            res.status(403).json({
                error: 'RecaptchaFailed',
                message: 'reCAPTCHA verification failed. Please try again.',
            });
            return;
        }

        // Score-based validation (0.0 = bot, 1.0 = human)
        if (data.score < env.recaptcha.minScore) {
            console.warn(`[reCAPTCHA] Score too low: ${data.score} (min: ${env.recaptcha.minScore})`);
            trackFailure(ip);

            res.status(403).json({
                error: 'RecaptchaScoreTooLow',
                message: 'Suspicious activity detected. Please try again.',
            });
            return;
        }

        // Success - attach result to request
        req.recaptcha = {
            success: true,
            score: data.score,
            action: data.action,
            challengeTimestamp: data.challengeTimestamp,
            hostname: data.hostname,
        };

        next();
    } catch (error) {
        console.error('[reCAPTCHA] Verification error:', error);

        // Allow request to proceed on network errors (fail open)
        // This prevents attackers from blocking reCAPTCHA API to bypass
        // In production, you might want to fail closed instead
        req.recaptcha = { success: false, score: 0 };
        next();
    }
}

/**
 * Optional reCAPTCHA - doesn't fail if no token, but validates if present
 */
export async function optionalRecaptcha(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const token = req.body?.recaptchaToken;

    if (!token) {
        next();
        return;
    }

    return verifyRecaptcha(req, res, next);
}
