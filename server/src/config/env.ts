import dotenv from 'dotenv';
dotenv.config();

export const env = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    // Firebase
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },

    // Supabase
    supabase: {
        url: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },

    // reCAPTCHA
    recaptcha: {
        secretKey: process.env.RECAPTCHA_SECRET_KEY!,
        minScore: 0.5, // Minimum acceptable score (0.0 - 1.0)
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // College domains for role mapping
    collegeDomains: ['kiet.edu', 'iiitbh.ac.in'] as const,
} as const;

// Validate required environment variables
export function validateEnv(): void {
    const required = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
