import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Initialize Supabase client with SERVICE ROLE key
 * This bypasses RLS - use with caution!
 * NEVER expose this client or key to the frontend
 */
export function initializeSupabase(): void {
    if (supabaseAdmin) return;

    supabaseAdmin = createClient(
        env.supabase.url,
        env.supabase.serviceRoleKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );

    console.log('[Supabase] Admin client initialized');
}

/**
 * Get Supabase admin client
 * All DB operations should go through this client
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }
    return supabaseAdmin;
}
