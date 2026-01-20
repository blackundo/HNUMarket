'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';
import { postSchema, type PostFormData } from '@/lib/validations/post';
import { createPost, updatePost, type Post } from '@/lib/api/posts';
import { uploadApi } from '@/lib/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipTapEditor } from './tiptap-editor';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/image';

interface PostFormProps {
  post?: Post;
}

/**
 * Post Form Component
 *
 * Reusable form for creating and editing blog posts.
 * Includes TipTap editor, cover image upload, and HTML sanitization.
 */
export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(post?.cover_image_url || '');
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      category: post?.category || '',
      tags: post?.tags || [],
      status: post?.status || 'draft',
    },
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadApi.uploadFile(file);
      // Store path only, not full URL - getImageUrl is used for display
      setCoverImage(url);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    }
    setUploading(false);
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);
    try {
      // Sanitize HTML content
      const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : undefined;

      const payload = {
        ...data,
        content: sanitizedContent,
        coverImageUrl: coverImage || undefined,
      };

      if (post) {
        await updatePost(post.id, payload);
      } else {
        await createPost(payload);
      }

      router.push('/admin/posts');
      router.refresh();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save post');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <Input {...register('title')} placeholder="Enter post title" className="text-lg" />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          {coverImage ? (
            <div className="relative inline-block">
              <img src={getImageUrl(coverImage)} alt="Cover" className="h-40 rounded object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:border-admin-primary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>Upload cover image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            {...register('excerpt')}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief summary (auto-generated if empty)"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Input {...register('category')} placeholder="e.g., News, Tips" />
          </div>

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
          {post ? 'Update Post' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
}
