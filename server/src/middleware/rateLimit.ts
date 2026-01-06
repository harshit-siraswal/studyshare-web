import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Token bucket entry for rate limiting
 */
interface RateLimitEntry {
    tokens: number;
    lastRefill: number;
}

/**
 * Rate limit configurations for different endpoint types
 */
interface RateLimitConfig {
    maxTokens: number;
    refillRate: number; // tokens per window
    windowMs: number;
}

/**
 * In-memory rate limit stores (per-instance, not distributed)
 */
const ipLimits = new Map<string, RateLimitEntry>();
const userLimits = new Map<string, RateLimitEntry>();

/**
 * Default rate limit configurations
 */
const RATE_CONFIGS: Record<string, RateLimitConfig> = {
    default: {
        maxTokens: 100,
        refillRate: 100,
        windowMs: 60000, // 1 minute
    },
    write: {
        maxTokens: 20,
        refillRate: 20,
        windowMs: 60000,
    },
    auth: {
        maxTokens: 10,
        refillRate: 10,
        windowMs: 60000,
    },
};

/**
 * Get client IP from request (handles proxies)
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
 * Check and consume rate limit token
 */
function checkRateLimit(
    store: Map<string, RateLimitEntry>,
    key: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry) {
        entry = { tokens: config.maxTokens, lastRefill: now };
        store.set(key, entry);
    }

    // Refill tokens based on time elapsed
    const elapsed = now - entry.lastRefill;
    const refillCount = Math.floor(elapsed / config.windowMs) * config.refillRate;

    if (refillCount > 0) {
        entry.tokens = Math.min(config.maxTokens, entry.tokens + refillCount);
        entry.lastRefill = now;
    }

    // Check if request is allowed
    if (entry.tokens > 0) {
        entry.tokens--;
        const resetIn = config.windowMs - (now - entry.lastRefill);
        return { allowed: true, remaining: entry.tokens, resetIn };
    }

    const resetIn = config.windowMs - (now - entry.lastRefill);
    return { allowed: false, remaining: 0, resetIn };
}

/**
 * Create rate limiting middleware
 * 
 * @param type - Rate limit type: 'default', 'write', or 'auth'
 */
export function rateLimit(type: 'default' | 'write' | 'auth' = 'default') {
    const config = RATE_CONFIGS[type];

    return (req: Request, res: Response, next: NextFunction): void => {
        const ip = getClientIp(req);
        const userId = req.user?.email;

        // Check IP-based limit
        const ipResult = checkRateLimit(ipLimits, ip, config);

        if (!ipResult.allowed) {
            res.status(429).json({
                error: 'TooManyRequests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(ipResult.resetIn / 1000),
            });
            return;
        }

        // Also check user-based limit if authenticated
        if (userId) {
            const userResult = checkRateLimit(userLimits, userId, config);

            if (!userResult.allowed) {
                res.status(429).json({
                    error: 'TooManyRequests',
                    message: 'Rate limit exceeded for your account.',
                    retryAfter: Math.ceil(userResult.resetIn / 1000),
                });
                return;
            }
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxTokens);
        res.setHeader('X-RateLimit-Remaining', ipResult.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(ipResult.resetIn / 1000));

        next();
    };
}

/**
 * Cleanup old entries periodically (every 5 minutes)
 * Prevents memory leaks from abandoned rate limit entries
 */
setInterval(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, entry] of ipLimits) {
        if (now - entry.lastRefill > maxAge) {
            ipLimits.delete(key);
        }
    }

    for (const [key, entry] of userLimits) {
        if (now - entry.lastRefill > maxAge) {
            userLimits.delete(key);
        }
    }
}, 5 * 60 * 1000);
