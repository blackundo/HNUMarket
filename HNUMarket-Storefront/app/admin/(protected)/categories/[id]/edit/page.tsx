'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { CategoryForm } from '@/components/admin/categories/category-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Edit Category Page
 *
 * Admin page for editing existing categories.
 * Fetches category data and passes to CategoryForm component.
 *
 * @route /admin/categories/[id]/edit
 */
export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await categoriesApi.getCategory(params.id as string);
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh mục');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCategory();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-admin-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground font-body">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Sửa danh mục</h1>
          <Link href="/admin/categories">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Sửa danh mục</h1>
          <Link href="/admin/categories">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>Không tìm thấy danh mục</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <CategoryForm category={category} mode="edit" />;
}

