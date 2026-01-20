import { getAuthHeaders, getAccessToken } from '@/lib/supabase/auth-helpers';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from '@/lib/validations/product';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;



/**
 * Product API response types
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  meta_title?: string;
  meta_description?: string;
  category_id?: string;
  stock: number;
  sku?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  display_name?: string;
  type?: string;
  value?: string;
  unit: string; // Vietnamese unit: goi, loc, thung, etc.
  conversion_rate: number; // Conversion to base unit
  price: number; // Absolute price in KRW
  stock: number;
  sku?: string;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TrashedProduct extends Product {
  deleted_at: string;
  deleted_by?: string;
  expires_at: string;
  product_created_at: string;
  product_updated_at: string;
}

export interface TrashQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'deleted_at' | 'expires_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface TrashListResponse {
  data: TrashedProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Products API Client
 */
export const productsApi = {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(query?: Partial<ProductQuery>): Promise<ProductListResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/admin/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch products');
    }

    return response.json();
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/${id}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch product');
    }

    return response.json();
  },

  /**
   * Create new product
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Failed to create product';
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Failed to update product';
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Move product to trash (replaces old delete)
   */
  async deleteProduct(id: string): Promise<{ message: string; expiresAt: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to move product to trash');
    }

    return response.json();
  },

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(slug: string, excludeId?: string): Promise<{ available: boolean }> {
    const headers = await getAuthHeaders();
    const url = `${API_URL}/admin/products/check-slug/${encodeURIComponent(slug)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to check slug availability');
    }

    return response.json();
  },

  /**
   * Get products in trash
   */
  async getTrashProducts(query?: TrashQueryParams): Promise<TrashListResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/admin/products/trash${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch trash products');
    }

    return response.json();
  },

  /**
   * Restore product from trash
   */
  async restoreFromTrash(id: string): Promise<Product> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/${id}/restore`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to restore product');
    }

    return response.json();
  },

  /**
   * Permanently delete product from trash
   */
  async permanentDeleteProduct(id: string): Promise<{ message: string; id: string; name: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/trash/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to permanently delete product');
    }

    return response.json();
  },

  /**
   * Empty entire trash
   */
  async emptyTrash(): Promise<{ message: string; deletedCount: number }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/trash`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to empty trash');
    }

    return response.json();
  },

  /**
   * Bulk move products to trash
   */
  async bulkMoveToTrash(ids: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/bulk/trash`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to bulk move to trash');
    }

    return response.json();
  },

  /**
   * Bulk restore products from trash
   */
  async bulkRestore(ids: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/products/bulk/restore`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to bulk restore');
    }

    return response.json();
  },
};

/**
 * Upload API Client
 */
export const uploadApi = {
  /**
   * Upload single file
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/admin/upload/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to upload file');
    }

    return response.json();
  },

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[]): Promise<{ urls: string[] }> {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_URL}/admin/upload/multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to upload files');
    }

    return response.json();
  },
};
