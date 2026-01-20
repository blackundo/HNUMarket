import { createClient } from './client';

/**
 * Cross-tab lock mechanism using localStorage
 * Prevents concurrent token refresh across multiple browser tabs
 */
const REFRESH_LOCK_KEY = 'supabase.auth.refresh_lock';
const REFRESH_LOCK_TIMEOUT = 10000; // 10s max lock duration

/**
 * In-tab refresh promise (for same-tab deduplication)
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Acquire cross-tab lock for token refresh
 * Uses localStorage to coordinate across tabs
 *
 * @returns true if lock acquired, false if another tab holds the lock
 */
function acquireRefreshLock(): boolean {
    if (typeof window === 'undefined') return true;

    const now = Date.now();
    const lockData = localStorage.getItem(REFRESH_LOCK_KEY);

    if (lockData) {
        try {
            const { timestamp } = JSON.parse(lockData);
            // Lock expired? (stale lock from crashed tab)
            if (now - timestamp < REFRESH_LOCK_TIMEOUT) {
                return false; // Another tab holds lock
            }
        } catch {
            // Invalid lock data, proceed
        }
    }

    // Acquire lock
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ timestamp: now }));
    return true;
}

/**
 * Release cross-tab refresh lock
 */
function releaseRefreshLock(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFRESH_LOCK_KEY);
}

/**
 * Wait for cross-tab lock to be released
 * Polls localStorage until lock is available or timeout
 */
async function waitForRefreshLock(maxWait: number = 10000): Promise<void> {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();
    const pollInterval = 100; // Check every 100ms

    while (Date.now() - startTime < maxWait) {
        const lockData = localStorage.getItem(REFRESH_LOCK_KEY);
        if (!lockData) return; // Lock released

        try {
            const { timestamp } = JSON.parse(lockData);
            if (Date.now() - timestamp >= REFRESH_LOCK_TIMEOUT) {
                // Lock expired, clean it up
                releaseRefreshLock();
                return;
            }
        } catch {
            // Invalid lock, consider it released
            return;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout waiting for lock, force release (might be stale)
    console.warn('[Auth] Force releasing stale refresh lock after timeout');
    releaseRefreshLock();
}

/**
 * Lấy access token một cách an toàn với cross-tab coordination
 *
 * Tránh race condition bằng cách:
 * 1. Per-tab Supabase client (no singleton)
 * 2. In-tab lock (refreshPromise) cho same-tab deduplication
 * 3. Cross-tab lock (localStorage) cho multi-tab coordination
 * 4. Kiểm tra token expiry trước khi refresh
 *
 * @returns Access token hoặc null nếu chưa đăng nhập
 */
export async function getAccessToken(): Promise<string | null> {
    const supabase = createClient();

    // In-tab deduplication: If refresh already in flight in THIS tab, wait for it
    if (refreshPromise) {
        console.log('[Auth] Waiting for in-tab refresh to complete...');
        return await refreshPromise;
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        // Check if token is still valid for at least 60 seconds
        const expiresAt = session.expires_at ?? 0;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt - now > 60) {
            return session.access_token;
        }
    }

    // Token about to expire or missing - need refresh
    // Use cross-tab lock to ensure only ONE tab refreshes at a time
    refreshPromise = (async () => {
        try {
            // Try to acquire cross-tab lock
            if (!acquireRefreshLock()) {
                console.log('[Auth] Another tab is refreshing token, waiting...');
                // Wait for other tab to finish
                await waitForRefreshLock();

                // After other tab completes, get fresh session from storage
                const { data: { session: freshSession } } = await supabase.auth.getSession();
                return freshSession?.access_token ?? null;
            }

            console.log('[Auth] Refreshing session token...');

            // This tab acquired the lock - perform refresh
            const { data, error } = await supabase.auth.refreshSession();

            if (error || !data.session) {
                console.error('[Auth] Refresh failed:', error);

                // Fallback: Try getUser() which validates with server
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError || !userData.user) {
                    return null;
                }

                // User valid but session missing, get session again
                const { data: newSessionData } = await supabase.auth.getSession();
                return newSessionData.session?.access_token ?? null;
            }

            console.log('[Auth] Session refreshed successfully');
            return data.session.access_token;
        } catch (error) {
            console.error('[Auth] Failed to refresh token:', error);
            return null;
        } finally {
            // Always release locks
            releaseRefreshLock();
            refreshPromise = null;
        }
    })();

    return await refreshPromise;
}

/**
 * Lấy headers cho authenticated API requests
 *
 * @throws Error nếu user chưa đăng nhập
 * @returns Headers object với Authorization Bearer token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Lấy optional auth headers
 * Không throw error nếu chưa đăng nhập, chỉ trả về headers cơ bản
 *
 * Dùng cho endpoints có thể hoạt động cả với guest và authenticated users
 *
 * @returns Headers object, có thể có hoặc không có Authorization
 */
export async function getOptionalAuthHeaders(): Promise<HeadersInit> {
    try {
        return await getAuthHeaders();
    } catch {
        return {
            'Content-Type': 'application/json',
        };
    }
}

/**
 * Kiểm tra user đã đăng nhập chưa
 *
 * @returns true nếu có valid access token
 */
export async function isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    return token !== null;
}
