import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { env } from './env';

let app: App | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment
 */
export function initializeFirebase(): void {
    if (app) return; // Already initialized

    try {
        app = initializeApp({
            credential: cert({
                projectId: env.firebase.projectId,
                clientEmail: env.firebase.clientEmail,
                privateKey: env.firebase.privateKey,
            }),
        });

        auth = getAuth(app);
        console.log('[Firebase] Admin SDK initialized successfully');
    } catch (error) {
        console.error('[Firebase] Failed to initialize:', error);
        throw error;
    }
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
    if (!auth) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return auth;
}
