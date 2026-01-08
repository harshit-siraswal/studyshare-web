import { env, validateEnv } from './config/env';
import { initializeFirebase } from './config/firebase';
import { initializeSupabase } from './config/supabase';
import { createApp } from './app';

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
