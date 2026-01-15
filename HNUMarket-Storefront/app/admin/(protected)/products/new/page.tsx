import { ProductForm } from '@/components/admin/products/product-form';

/**
 * New Product Page
 *
 * Admin page for creating new products.
 * Uses ProductForm component in create mode.
 *
 * @route /admin/products/new
 */
export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
