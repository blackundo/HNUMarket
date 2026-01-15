'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPost, type Post } from '@/lib/api/posts';
import { PostForm } from '@/components/admin/posts/post-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Edit Post Page
 *
 * Admin page for editing existing blog posts.
 * Fetches post data and passes to PostForm component.
 *
 * @route /admin/posts/[id]/edit
 */
export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getPost(params.id as string);
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-admin-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <Link href="/admin/posts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <Link href="/admin/posts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>Post not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Post</h1>
      <PostForm post={post} />
    </div>
  );
}
