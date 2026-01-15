'use client';

import { HeroSlideForm } from '@/components/admin/hero-slides/hero-slide-form';

/**
 * Create New Hero Slide Page
 *
 * Admin page for creating a new hero slide with image upload and configuration.
 *
 * @route /admin/hero-slides/new
 */
export default function NewHeroSlidePage() {
  return <HeroSlideForm mode="create" />;
}
