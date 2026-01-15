import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware for session management and route protection
 *
 * Runs on every request to:
 * 1. Refresh Supabase session automatically
 * 2. Protect admin routes from unauthorized access
 * 3. Update authentication cookies
 *
 * @param request - Next.js request object
 * @returns Updated response with session cookies
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Middleware configuration
 *
 * Matches all routes except:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon
 * - Common image formats
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
