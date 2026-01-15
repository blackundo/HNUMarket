import { createBrowserClient } from '@supabase/ssr';

/**
 * Create Supabase browser client for client-side operations
 *
 * Used in Client Components for authentication and data fetching.
 * Automatically handles cookie-based session management.
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
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
