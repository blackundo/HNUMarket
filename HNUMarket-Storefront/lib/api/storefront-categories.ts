/**
 * Storefront Categories API Client
 *
 * Public API for category listing and category products.
 * No authentication required.
 */

import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

/**
 * Category interface for storefront
 */
export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'price' | 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ProductListResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Storefront Categories API
 */
export const storefrontCategoriesApi = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<StorefrontCategory[]> {
    const response = await fetch(`${API_URL}/storefront/categories`, {
      next: {
        revalidate: 300, // Cache for 5 minutes (categories rarely change)
        tags: ['categories']
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  },

  /**
   * Get single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<StorefrontCategory> {
    const response = await fetch(`${API_URL}/storefront/categories/${slug}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch category');
    }

    return response.json();
  },

  /**
   * Get products by category slug
   */
  async getCategoryProducts(slug: string, query?: ProductQuery): Promise<ProductListResponse> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/storefront/categories/${slug}/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch category products');
    }

    return response.json();
  },
};
