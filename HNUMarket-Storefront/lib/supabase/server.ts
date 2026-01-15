import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create Supabase server client for server-side operations
 *
 * Used in Server Components, Server Actions, and Route Handlers.
 * Handles cookie management for session persistence.
 *
 * @returns Supabase client instance
 *
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function DashboardPage() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component - cookies can be read but not set
            // This error is expected and can be safely ignored
          }
        },
      },
    },
  );
}
