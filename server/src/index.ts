import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env, validateEnv } from './config/env.js';
import { initializeFirebase } from './config/firebase.js';
import { initializeSupabase } from './config/supabase.js';
import { errorHandler, notFoundHandler, rateLimit } from './middleware/index.js';
import routes from './routes/index.js';

// Track server start time for uptime
const startTime = Date.now();

/**
 * Create and configure Express application
 */
function createApp(): Express {
    const app = express();

    // Security middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));

    // CORS configuration
    app.use(cors({
        origin: env.isDev
            ? ['http://localhost:5173', 'http://localhost:3000']
            : ['https://new-exex.vercel.app', 'https://studyspace-kiet.vercel.app'],
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

    // API routes with base rate limiting
    app.use('/api', rateLimit('default'), routes);

    // 404 handler for unmatched routes
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
}

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
 * Initialize services and start server
 */
async function main(): Promise<void> {
    console.log('🚀 Starting StudySpace Backend...');
    console.log(`📍 Environment: ${env.nodeEnv}`);

    // Validate environment
    try {
        validateEnv();
        console.log('✅ Environment validated');
    } catch (error) {
        console.error('❌ Environment validation failed:', error);
        process.exit(1);
    }

    // Initialize Firebase
    try {
        initializeFirebase();
        console.log('✅ Firebase initialized');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        process.exit(1);
    }

    // Initialize Supabase
    try {
        initializeSupabase();
        console.log('✅ Supabase initialized');
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        process.exit(1);
    }

    // Create and start Express app
    const app = createApp();

    app.listen(env.port, () => {
        console.log(`✅ Server running on port ${env.port}`);
        console.log(`📡 Health check: http://localhost:${env.port}/health`);
        console.log(`🔗 API base: http://localhost:${env.port}/api`);
    });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

// Start the server
main();
