'use client';

import { PostsList } from '@/components/admin/posts/posts-list';

/**
 * Posts List Page
 *
 * Admin page for managing blog posts using Refine.
 * Features: search, status filter, pagination, delete.
 *
 * @route /admin/posts
 */
export default function PostsPage() {
  return <PostsList />;
}
