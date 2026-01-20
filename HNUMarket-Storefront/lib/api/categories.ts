import { getAuthHeaders } from '@/lib/supabase/auth-helpers';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQuery,
} from '@/lib/validations/category';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;



/**
 * Category API response types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
  product_count?: number;
}

export interface CategoryListResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Categories API Client
 */
export const categoriesApi = {
  /**
   * Get all categories with pagination and filters
   */
  async getCategories(query?: Partial<CategoryQuery>): Promise<CategoryListResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/admin/categories${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  },

  /**
   * Get single category by ID
   */
  async getCategory(id: string): Promise<Category> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/categories/${id}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch category');
    }

    return response.json();
  },

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to create category');
    }

    return response.json();
  },

  /**
   * Update existing category
   */
  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to update category');
    }

    return response.json();
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete category');
    }
  },

  /**
   * Reorder categories
   */
  async reorderCategories(ids: string[]): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/categories/reorder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to reorder categories');
    }
  },
};

