import { createClient } from '@/lib/supabase/client';
import type {
  CreateHeroSlideInput,
  UpdateHeroSlideInput,
  HeroSlideQuery,
} from '@/lib/validations/hero-slide';
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
 * Hero Slide API response types
 */
export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  gradient?: string;
  link: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideListResponse {
  data: HeroSlide[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Hero Slides API Client
 */
export const heroSlidesApi = {
  /**
   * Get all hero slides with pagination and filters
   */
  async getHeroSlides(query?: Partial<HeroSlideQuery>): Promise<HeroSlideListResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/admin/hero-slides${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch hero slides');
    }

    return response.json();
  },

  /**
   * Get single hero slide by ID
   */
  async getHeroSlide(id: string): Promise<HeroSlide> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/hero-slides/${id}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch hero slide');
    }

    return response.json();
  },

  /**
   * Create new hero slide
   */
  async createHeroSlide(data: CreateHeroSlideInput): Promise<HeroSlide> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/hero-slides`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to create hero slide');
    }

    return response.json();
  },

  /**
   * Update existing hero slide
   */
  async updateHeroSlide(id: string, data: UpdateHeroSlideInput): Promise<HeroSlide> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/hero-slides/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to update hero slide');
    }

    return response.json();
  },

  /**
   * Delete hero slide
   */
  async deleteHeroSlide(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/hero-slides/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete hero slide');
    }
  },

  /**
   * Reorder hero slides
   */
  async reorderHeroSlides(ids: string[]): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/hero-slides/reorder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to reorder hero slides');
    }
  },
};

/**
 * Storefront Hero Slides API (public, no auth required)
 */
export const storefrontHeroSlidesApi = {
  /**
   * Get active hero slides for storefront
   */
  async getActiveHeroSlides(): Promise<HeroSlide[]> {
    const response = await fetch(`${API_URL}/hero-slides`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch hero slides');
    }

    return response.json();
  },
};
