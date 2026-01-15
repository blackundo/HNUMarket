/**
 * API Configuration
 *
 * Centralized API URL configuration for all API clients.
 *
 * Priority:
 * 1. API_URL - Server-side internal Docker network URL (fastest, most secure)
 * 2. NEXT_PUBLIC_API_URL - Client-side public URL via proxy
 * 3. Fallback - localhost for development
 */

/**
 * Get the appropriate API URL based on the environment
 *
 * - Server-side (SSR, API routes): Uses internal Docker network URL (API_URL)
 * - Client-side (browser): Uses public URL (NEXT_PUBLIC_API_URL)
 * - Development: Falls back to localhost
 */
export const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api';

/**
 * Helper to check if code is running on server-side
 */
export const isServer = typeof window === 'undefined';

/**
 * Get API URL with optional logging (useful for debugging)
 */
export function getApiUrl(debug = false): string {
  if (debug && isServer) {
    console.log('[API Config]', {
      isServer,
      API_URL: process.env.API_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      resolved: API_BASE_URL,
    });
  }
  return API_BASE_URL;
}
