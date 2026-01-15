/**
 * Storefront Pages API Client
 *
 * Public API for static pages on storefront.
 * No authentication required.
 */

import { API_BASE_URL } from '@/lib/config/api';

const API_URL = API_BASE_URL;

export interface StorefrontPage {
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

export const storefrontPagesApi = {
  /**
   * Get all published pages
   */
  async getPages(): Promise<StorefrontPage[]> {
    const response = await fetch(`${API_URL}/storefront/pages`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch pages');
    }

    return response.json();
  },

  /**
   * Get published page by slug
   */
  async getPageBySlug(slug: string): Promise<StorefrontPage> {
    const response = await fetch(`${API_URL}/storefront/pages/${slug}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to fetch page');
    }

    return response.json();
  },
};
