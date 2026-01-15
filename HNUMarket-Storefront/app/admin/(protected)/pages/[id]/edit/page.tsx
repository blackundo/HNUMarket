'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPage, type Page } from '@/lib/api/pages';
import { PageForm } from '@/components/admin/pages/page-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Edit Page
 *
 * Admin page for editing existing static pages.
 *
 * @route /admin/pages/[id]/edit
 */
export default function EditPage() {
  const params = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getPage(params.id as string);
        setPage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPage();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-admin-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Page</h1>
          <Link href="/admin/pages">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Page</h1>
          <Link href="/admin/pages">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>Page not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Page</h1>
      <PageForm page={page} />
    </div>
  );
}
