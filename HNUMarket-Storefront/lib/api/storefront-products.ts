/**
 * Storefront Products API Client
 *
 * Public API for product listing, search, and details on storefront.
 * No authentication required.
 */

import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

/**
 * Product interface for storefront
 */
export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  category_id?: string;
  stock: number;
  sku?: string;
  is_active: boolean;
  sold?: number;
  specifications?: Record<string, string>;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[]; // Multi-attribute product options
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

/**
 * Product option (normalized multi-attribute system)
 */
export interface ProductOption {
  id: string;
  product_id: string;
  name: string; // e.g., "Color", "Size", "Material"
  position: number;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string; // e.g., "Blue", "M", "Cotton"
}

/**
 * Legacy product variant (deprecated)
 * @deprecated Use normalized variant system with attributes instead
 */
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  display_name?: string;
  type?: string;
  value?: string;
  unit: string; // Vietnamese unit: goi, loc, thung, etc.
  conversion_rate: number; // Conversion to base unit
  stock: number;
  price: number; // Absolute price in KRW
  sku?: string;
  // Normalized variant fields
  attributes?: Record<string, string>; // e.g., { "Color": "Blue", "Size": "M" }
  original_price?: number; // For discount display
}

export interface ProductListResponse {
  data: StorefrontProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

/**
 * Storefront Products API
 */
export const storefrontProductsApi = {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(query?: ProductQuery): Promise<ProductListResponse> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/storefront/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch products');
    }

    return response.json();
  },

  /**
   * Get single product by slug
   */
  async getProductBySlug(slug: string): Promise<StorefrontProduct> {
    const response = await fetch(`${API_URL}/storefront/products/${slug}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch product');
    }

    return response.json();
  },

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<StorefrontProduct> {
    const response = await fetch(`${API_URL}/storefront/products/by-id/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch product');
    }

    return response.json();
  },

  /**
   * Get multiple products by IDs
   * Useful for cart items
   */
  async getProductsByIds(ids: string[]): Promise<StorefrontProduct[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const response = await fetch(`${API_URL}/storefront/products/by-ids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch products');
    }

    return response.json();
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<StorefrontProduct[]> {
    const response = await fetch(`${API_URL}/storefront/products/featured?limit=${limit}`, {
      next: {
        revalidate: 300, // Cache for 5 minutes (matches backend cache)
        tags: ['products', 'featured-products']
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch featured products');
    }

    return response.json();
  },

  /**
   * Get flash sale products
   */
  async getFlashSaleProducts(limit: number = 8): Promise<StorefrontProduct[]> {
    const response = await fetch(`${API_URL}/storefront/products/flash-sale?limit=${limit}`, {
      next: {
        revalidate: 300, // Cache for 5 minutes (matches backend cache)
        tags: ['products', 'flash-sale']
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch flash sale products');
    }

    return response.json();
  },

  /**
   * Search products
   */
  async searchProducts(query: string, options?: ProductQuery): Promise<ProductListResponse> {
    return this.getProducts({ search: query, limit: 20, ...options });
  },
};
