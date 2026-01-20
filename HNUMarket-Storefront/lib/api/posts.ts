import { getOptionalAuthHeaders } from '@/lib/supabase/auth-helpers';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

async function getAuthHeader(): Promise<HeadersInit> {
  return getOptionalAuthHeaders();
}

/**
 * Post Interface
 */
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  author_id?: string;
  category?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Posts List Response
 */
export interface PostsResponse {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Posts Query Parameters
 */
export interface PostsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: 'title' | 'createdAt' | 'publishedAt' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all posts with pagination and filtering
 */
export async function getPosts(params?: PostsQueryParams): Promise<PostsResponse> {
  const headers = await getAuthHeader();
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`${API_URL}/admin/posts?${searchParams}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}

/**
 * Get single post by ID
 */
export async function getPost(id: string): Promise<Post> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch post');
  }

  return response.json();
}

/**
 * Create new post
 */
export async function createPost(data: Record<string, any>): Promise<Post> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create post' }));
    throw new Error(error.message || 'Failed to create post');
  }

  return response.json();
}

/**
 * Update existing post
 */
export async function updatePost(id: string, data: Record<string, any>): Promise<Post> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts/${id}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update post' }));
    throw new Error(error.message || 'Failed to update post');
  }

  return response.json();
}

/**
 * Delete post (soft delete via archiving)
 */
export async function deletePost(id: string): Promise<void> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
}

/**
 * Publish post
 */
export async function publishPost(id: string): Promise<Post> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts/${id}/publish`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to publish post');
  }

  return response.json();
}

/**
 * Unpublish post (set to draft)
 */
export async function unpublishPost(id: string): Promise<Post> {
  const headers = await getAuthHeader();

  const response = await fetch(`${API_URL}/admin/posts/${id}/unpublish`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to unpublish post');
  }

  return response.json();
}
