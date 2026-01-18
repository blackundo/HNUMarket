import { Suspense } from 'react';
import { BookOpen } from 'lucide-react';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogPagination } from '@/components/blog/blog-pagination';
import { storefrontPostsApi } from '@/lib/api/storefront-posts';

const POSTS_PER_PAGE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * Blog listing page showing all published blog posts with pagination
 */
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));

  let posts: any[] = [];
  let total = 0;
  let totalPages = 0;

  try {
    const response = await storefrontPostsApi.getPosts({
      page: currentPage,
      limit: POSTS_PER_PAGE,
    });
    posts = response.data;
    total = response.meta.total;
    totalPages = response.meta.totalPages;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Blog</h1>
              <p className="text-gray-600">{total} bài viết</p>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <Suspense fallback={null}>
              <BlogPagination currentPage={currentPage} totalPages={totalPages} />
            </Suspense>
          </>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có bài viết</h3>
            <p className="text-gray-600">Hiện tại chưa có bài viết nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}