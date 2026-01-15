'use client';

import { HeroSlidesList } from '@/components/admin/hero-slides/hero-slides-list';

/**
 * Admin Hero Slides List Page
 *
 * Displays all hero slides with search, pagination, drag-and-drop reordering, and CRUD actions.
 * Admin-only page protected by middleware.
 *
 * @route /admin/hero-slides
 */
export default function HeroSlidesPage() {
  return <HeroSlidesList />;
}
