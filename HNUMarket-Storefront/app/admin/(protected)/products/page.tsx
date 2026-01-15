'use client';

import { ProductsList } from '@/components/admin/products/products-list';

/**
 * Admin Products List Page
 *
 * Displays all products with search, pagination, and CRUD actions using Refine.
 * Admin-only page protected by middleware.
 *
 * @route /admin/products
 */
export default function ProductsPage() {
  return <ProductsList />;
}
