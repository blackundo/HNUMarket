import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BlogPostContent } from '@/components/blog/blog-post-content';
import { storefrontPostsApi } from '@/lib/api/storefront-posts';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for blog post page
 */
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await storefrontPostsApi.getPostBySlug(slug);

    if (!post) {
      return {
        title: 'Bài viết không tồn tại',
      };
    }

    return {
      title: post.title,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: 'article',
        publishedTime: post.published_at || post.created_at,
        modifiedTime: post.updated_at,
        images: post.cover_image_url ? [post.cover_image_url] : [],
      },
    };
  } catch {
    return {
      title: 'Blog',
    };
  }
}

/**
 * Blog post detail page with full content
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  let post = null;

  try {
    post = await storefrontPostsApi.getPostBySlug(slug);
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogPostContent post={post} />
      </div>
    </div>
  );
}