import { PostForm } from '@/components/admin/posts/post-form';

/**
 * New Post Page
 *
 * Admin page for creating new blog posts.
 * Uses PostForm component in create mode.
 *
 * @route /admin/posts/new
 */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Post</h1>
      <PostForm />
    </div>
  );
}
