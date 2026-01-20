import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create Supabase browser client for client-side operations
 *
 * Creates a fresh client instance with proper configuration for:
 * - PKCE auth flow (more secure than implicit flow)
 * - Automatic token refresh across tabs
 * - Session persistence in localStorage
 * - Cross-tab session synchronization
 *
 * Note: Supabase internally handles client caching and deduplication,
 * so we don't need a manual singleton pattern. Each tab gets its own
 * client instance which properly syncs via localStorage events.
 *
 * @returns Supabase client instance
 *
 * @example
 * ```typescript
 * 'use client';
 *
 * import { createClient } from '@/lib/supabase/client';
 *
 * export function LoginForm() {
 *   const supabase = createClient();
 *
 *   const handleLogin = async (email: string, password: string) => {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email,
 *       password,
 *     });
 *   };
 * }
 * ```
 */
export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use PKCE flow for better security (default in newer versions)
        flowType: 'pkce',
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Detect session from URL hash fragments (for OAuth callbacks)
        detectSessionInUrl: true,
        // Persist session in localStorage for cross-tab sync
        persistSession: true,
        // Use localStorage for session storage (enables cross-tab sync)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
}
