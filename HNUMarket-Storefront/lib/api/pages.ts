import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

/**
 * Get authentication headers with JWT token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Page Interface
 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Pages List Response
 */
export interface PagesResponse {
  data: Page[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Pages Query Parameters
 */
export interface PagesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: 'title' | 'createdAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all pages with pagination and filtering
 */
export async function getPages(params?: PagesQueryParams): Promise<PagesResponse> {
  const headers = await getAuthHeader();
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`${API_URL}/admin/pages?${searchParams}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pages');
  }

  return response.json();
}

/**
 * Get single page by ID
 */
export async function getPage(id: string): Promise<Page> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch page');
  }

  return response.json();
}

/**
 * Create new page
 */
export async function createPage(data: Record<string, any>): Promise<Page> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create page' }));
    throw new Error(error.message || 'Failed to create page');
  }

  return response.json();
}

/**
 * Update existing page
 */
export async function updatePage(id: string, data: Record<string, any>): Promise<Page> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages/${id}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update page' }));
    throw new Error(error.message || 'Failed to update page');
  }

  return response.json();
}

/**
 * Delete page (soft delete via archiving)
 */
export async function deletePage(id: string): Promise<void> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete page');
  }
}

/**
 * Publish page
 */
export async function publishPage(id: string): Promise<Page> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages/${id}/publish`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to publish page');
  }

  return response.json();
}

/**
 * Unpublish page (set to draft)
 */
export async function unpublishPage(id: string): Promise<Page> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/pages/${id}/unpublish`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to unpublish page');
  }

  return response.json();
}
