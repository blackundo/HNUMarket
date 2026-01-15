'use client';

import { CategoriesList } from '@/components/admin/categories/categories-list';

/**
 * Admin Categories List Page
 *
 * Displays all categories with search, pagination, and CRUD actions using Refine.
 * Admin-only page protected by middleware.
 *
 * @route /admin/categories
 */
export default function CategoriesPage() {
  return <CategoriesList />;
}

