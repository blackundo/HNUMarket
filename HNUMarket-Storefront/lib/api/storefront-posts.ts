/**
 * Storefront Posts API Client
 *
 * Public API for blog posts on storefront.
 * No authentication required - only shows published posts.
 */

import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

/**
 * Post interface for storefront (public)
 */
export interface StorefrontPost {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    content?: string;
    cover_image_url?: string;
    author_id?: string;
    category?: string;
    tags: string[];
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
export interface StorefrontPostsResponse {
    data: StorefrontPost[];
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
export interface StorefrontPostsQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
}

/**
 * Storefront Posts API
 */
export const storefrontPostsApi = {
    /**
     * Get all published posts with pagination
     */
    async getPosts(query?: StorefrontPostsQuery): Promise<StorefrontPostsResponse> {
        const params = new URLSearchParams();

        if (query) {
            if (query.page) params.append('page', String(query.page));
            if (query.limit) params.append('limit', String(query.limit));
            if (query.search) params.append('search', query.search);
            if (query.category) params.append('category', query.category);
            if (query.tag) params.append('tag', query.tag);
        }

        const url = `${API_URL}/storefront/posts${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
            next: {
                revalidate: 60, // Cache for 1 minute
                tags: ['posts'],
            },
        });

        if (!response.ok) {
            // If storefront API not available, return empty response
            if (response.status === 404) {
                return {
                    data: [],
                    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
                };
            }
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'Failed to fetch posts');
        }

        return response.json();
    },

    /**
     * Get single post by slug
     */
    async getPostBySlug(slug: string): Promise<StorefrontPost | null> {
        const response = await fetch(`${API_URL}/storefront/posts/${slug}`, {
            next: {
                revalidate: 60,
                tags: ['posts', `post-${slug}`],
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'Failed to fetch post');
        }

        return response.json();
    },

    /**
     * Get recent posts
     */
    async getRecentPosts(limit: number = 5): Promise<StorefrontPost[]> {
        const response = await this.getPosts({ limit, page: 1 });
        return response.data;
    },

    /**
     * Get related posts by category
     */
    async getRelatedPosts(category: string, excludeId: string, limit: number = 4): Promise<StorefrontPost[]> {
        const response = await this.getPosts({ category, limit: limit + 1 });
        return response.data.filter((post) => post.id !== excludeId).slice(0, limit);
    },
};