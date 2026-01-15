import { CategoryForm } from '@/components/admin/categories/category-form';

/**
 * New Category Page
 *
 * Admin page for creating new categories.
 * Uses CategoryForm component in create mode.
 *
 * @route /admin/categories/new
 */
export default function NewCategoryPage() {
  return <CategoryForm mode="create" />;
}

