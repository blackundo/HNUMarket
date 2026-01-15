'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi, type Product } from '@/lib/api/products';
import { ProductForm } from '@/components/admin/products/product-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Edit Product Page
 *
 * Admin page for editing existing products.
 * Fetches product data and passes to ProductForm component.
 *
 * @route /admin/products/[id]/edit
 */
export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await productsApi.getProduct(params.id as string);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-admin-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <Link href="/admin/products">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <Link href="/admin/products">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>Product not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ProductForm product={product} mode="edit" />;
}
