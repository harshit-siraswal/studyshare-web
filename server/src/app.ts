import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env';
import { notFoundHandler, rateLimit } from './middleware/index';
// We need to handle the circular dependency of error handler if it's not careful, 
// but usually it's fine.
import { errorHandler } from './middleware/errorHandler'; // Importing specific file to be safe
import routes from './routes/index';

// Track server start time for uptime
const startTime = Date.now();

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Create and configure Express application
 */
export function createApp(): Express {
    const app = express();

    // Security middleware - Hardened configuration
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        // Prevent Clickjacking
        frameguard: { action: 'deny' },
        // Strict Content Security Policy
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'], // reCAPTCHA
                frameSrc: ["'self'", 'https://www.google.com'], // reCAPTCHA iframe
                imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
                connectSrc: ["'self'", 'https://api.cloudinary.com', 'https://www.google.com'],
            },
        },
        // Hide X-Powered-By
        hidePoweredBy: true,
    }));

    // CORS configuration
    app.use(cors({
        origin: env.isDev
            ? ['http://localhost:5173', 'http://localhost:3000']
            : [
                'https://new-exex.vercel.app',
                'https://studyspace-kiet.vercel.app',
                'https://www.mystudyspace.me',
                'https://mystudyspace.me',
                'https://adminstudyspace-zdws.vercel.app'  // Admin dashboard
            ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Trust proxy for rate limiting IP detection (Render uses proxies)
    app.set('trust proxy', 1);

    // Health check endpoint (no auth required)
    app.get('/health', (req: Request, res: Response) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.json({
            status: 'ok',
            uptime,
            uptimeFormatted: formatUptime(uptime),
            timestamp: new Date().toISOString(),
            environment: env.nodeEnv,
        });
    });

    // Performance: Request timing and slow query logging
    app.use((req: Request, res: Response, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            // Log slow requests (>500ms)
            if (duration > 500) {
                console.warn(`[SLOW] ${req.method} ${req.path} - ${duration}ms`);
            }
        });
        next();
    });

    // Performance: Cache headers for GET API responses
    app.use('/api', (req: Request, res: Response, next) => {
        if (req.method === 'GET') {
            // Cache public GET responses for 60 seconds
            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        } else {
            // No cache for mutations
            res.setHeader('Cache-Control', 'no-store');
        }
        next();
    });

    // API routes with base rate limiting
    app.use('/api', rateLimit('default'), routes);

    // 404 handler for unmatched routes
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
}
