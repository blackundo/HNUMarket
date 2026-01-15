'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';
import { pageSchema, type PageFormData } from '@/lib/validations/page';
import { createPage, updatePage, type Page } from '@/lib/api/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipTapEditor } from '@/components/admin/posts/tiptap-editor';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageFormProps {
  page?: Page;
}

/**
 * Page Form Component
 *
 * Reusable form for creating and editing static pages.
 * Includes TipTap editor and HTML sanitization.
 */
export function PageForm({ page }: PageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title || '',
      slug: page?.slug || '',
      content: page?.content || '',
      metaTitle: page?.meta_title || '',
      metaDescription: page?.meta_description || '',
      status: page?.status || 'draft',
    },
  });

  const onSubmit = async (data: PageFormData) => {
    setLoading(true);
    try {
      const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : undefined;
      const cleanedSlug = data.slug?.trim() || undefined;
      const cleanedMetaTitle = data.metaTitle?.trim() || undefined;
      const cleanedMetaDescription = data.metaDescription?.trim() || undefined;

      const payload = {
        title: data.title,
        slug: cleanedSlug,
        content: sanitizedContent,
        metaTitle: cleanedMetaTitle,
        metaDescription: cleanedMetaDescription,
        status: data.status,
      };

      if (page) {
        await updatePage(page.id, payload);
      } else {
        await createPage(payload);
      }

      router.push('/admin/pages');
      router.refresh();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save page');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <Input {...register('title')} placeholder="Enter page title" className="text-lg" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <Input {...register('slug')} placeholder="tu-dong-theo-tieu-de" />
          <p className="mt-1 text-xs text-muted-foreground">
            Bỏ trống để tự động tạo từ tiêu đề.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
          <Input {...register('metaTitle')} placeholder="SEO title" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
          <textarea
            {...register('metaDescription')}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="SEO description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TipTapEditor content={field.value || ''} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {page ? 'Update Page' : 'Create Page'}
        </Button>
      </div>
    </form>
  );
}
