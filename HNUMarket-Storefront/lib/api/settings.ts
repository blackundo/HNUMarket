import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

// Cache for public settings (5 minutes TTL)
const PUBLIC_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
let publicSettingsCache: {
  data: Record<string, any> | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getSettings(category?: string): Promise<Record<string, any>> {
  const headers = await getAuthHeader();
  const url = category
    ? `${API_URL}/admin/settings?category=${category}`
    : `${API_URL}/admin/settings`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
}

export async function updateSettings(
  settings: Record<string, { value: any; category?: string }>
): Promise<Record<string, any>> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/admin/settings`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  if (!response.ok) throw new Error('Failed to update settings');
  return response.json();
}

/**
 * Get public settings (no auth required)
 * Used by storefront for public configurations like Messenger Page ID
 * Cached for 5 minutes to reduce API calls
 */
export async function getPublicSettings(): Promise<Record<string, any>> {
  const now = Date.now();

  // Return cached data if still valid
  if (
    publicSettingsCache.data !== null &&
    now - publicSettingsCache.timestamp < PUBLIC_SETTINGS_CACHE_TTL
  ) {
    return publicSettingsCache.data;
  }

  const response = await fetch(`${API_URL}/storefront/settings/public`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch public settings');

  const data = await response.json();

  // Update cache
  publicSettingsCache = {
    data,
    timestamp: now,
  };

  return data;
}

/**
 * Clear public settings cache
 * Useful when settings are updated in admin
 */
export function clearPublicSettingsCache(): void {
  publicSettingsCache = {
    data: null,
    timestamp: 0,
  };
}
