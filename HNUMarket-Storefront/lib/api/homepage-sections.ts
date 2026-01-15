import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

/**
 * Get authentication headers with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Homepage Section Configuration Types
 */
export interface LayoutConfig {
  row_count: 1 | 2;
  display_style: 'slider' | 'grid' | 'carousel';
  product_limit: number;
  columns?: number;
  autoplay_delay?: number; // Carousel autoplay delay in ms (default: 3000)
}

export interface AutoFillConfig {
  enabled: boolean;
  criteria: 'newest' | 'best_selling' | 'featured' | 'random';
  min_stock?: number;
  exclude_out_of_stock?: boolean;
}

export interface ProductsConfig {
  selected_product_ids: string[];
  auto_fill: AutoFillConfig;
}

export interface BannerConfig {
  enabled: boolean;
  image_url?: string;
  link_url?: string;
  alt_text?: string;
  position?: 'left' | 'right';
  width_ratio?: number;
}

export interface DisplayConfig {
  show_category_header: boolean;
  custom_title?: string;
  show_view_all_link: boolean;
  animation?: 'fade' | 'slide' | 'none';
}

export interface HomepageSectionConfig {
  layout: LayoutConfig;
  products: ProductsConfig;
  banner?: BannerConfig;
  display: DisplayConfig;
}

/**
 * Homepage Section Types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export interface HomepageSection {
  id: string;
  category_id: string;
  display_order: number;
  is_active: boolean;
  config: HomepageSectionConfig;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface HomepageSectionWithProducts extends HomepageSection {
  products: any[];
}

export interface HomepageSectionListResponse {
  data: HomepageSection[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface HomepageSectionPreviewResponse {
  section: HomepageSection;
  products: any[];
  meta: {
    total: number;
    manual_count: number;
    auto_fill_count: number;
  };
}

/**
 * Query and Input Types
 */
export interface HomepageSectionQuery {
  page?: number;
  limit?: number;
  isActive?: string;
}

export interface CreateHomepageSectionInput {
  categoryId: string;
  displayOrder?: number;
  isActive?: boolean;
  config: HomepageSectionConfig;
}

export interface UpdateHomepageSectionInput extends Partial<CreateHomepageSectionInput> {}

export interface ReorderHomepageSectionsInput {
  ids: string[];
}

/**
 * Homepage Sections API Client (Admin)
 */
export const homepageSectionsApi = {
  /**
   * Get all homepage sections with pagination and filters
   */
  async getHomepageSections(
    query?: Partial<HomepageSectionQuery>
  ): Promise<HomepageSectionListResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/admin/homepage-sections${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch homepage sections');
    }

    return response.json();
  },

  /**
   * Get single homepage section by ID
   */
  async getHomepageSection(id: string): Promise<HomepageSection> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections/${id}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch homepage section');
    }

    return response.json();
  },

  /**
   * Create new homepage section
   */
  async createHomepageSection(data: CreateHomepageSectionInput): Promise<HomepageSection> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to create homepage section');
    }

    return response.json();
  },

  /**
   * Update existing homepage section
   */
  async updateHomepageSection(
    id: string,
    data: UpdateHomepageSectionInput
  ): Promise<HomepageSection> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to update homepage section');
    }

    return response.json();
  },

  /**
   * Delete homepage section
   */
  async deleteHomepageSection(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete homepage section');
    }
  },

  /**
   * Reorder homepage sections
   */
  async reorderHomepageSections(ids: string[]): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections/reorder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to reorder homepage sections');
    }
  },

  /**
   * Preview products for a section (manual + auto-fill resolved)
   */
  async previewProducts(id: string): Promise<HomepageSectionPreviewResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/homepage-sections/${id}/preview-products`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to preview products');
    }

    return response.json();
  },
};

/**
 * Storefront Homepage Sections API (public, no auth required)
 */
export const storefrontHomepageSectionsApi = {
  /**
   * Get active homepage sections with resolved products for storefront
   */
  async getHomepageSections(): Promise<HomepageSectionWithProducts[]> {
    const response = await fetch(`${API_URL}/storefront/homepage-sections`, {
      next: {
        revalidate: 60, // Cache for 60 seconds
        tags: ['homepage-sections'] // Cache tag for on-demand revalidation
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch homepage sections');
    }

    return response.json();
  },
};
