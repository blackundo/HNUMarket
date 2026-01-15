import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export interface ShippingLocation {
  id: string;
  name: string;
  fee: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateShippingLocationDto {
  name?: string;
  fee?: number;
  displayOrder?: number;
  isActive?: boolean;
}

// Admin APIs
export async function getLocations(): Promise<ShippingLocation[]> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/admin/shipping/locations`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
}

export async function createLocation(data: {
  name: string;
  fee: number;
  displayOrder?: number;
}): Promise<ShippingLocation> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/admin/shipping/locations`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create location');
  return response.json();
}

export async function updateLocation(
  id: string,
  data: UpdateShippingLocationDto,
): Promise<ShippingLocation> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/admin/shipping/locations/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update location');
  return response.json();
}

export async function deleteLocation(id: string): Promise<void> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/admin/shipping/locations/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('Failed to delete location');
}

// Public API (for storefront)
export async function getActiveLocations(): Promise<ShippingLocation[]> {
  const response = await fetch(`${API_URL}/storefront/shipping-locations`);
  if (!response.ok) throw new Error('Failed to fetch active locations');
  return response.json();
}
