import { notFound } from "next/navigation";
// import { getBlogPostBySlug } from "@/data/blog-posts-helpers"; // REMOVED: Mock data
import { BlogPostContent } from "@/components/blog/blog-post-content";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Blog post detail page with full content
 * TODO: Fetch blog post from real API
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // TODO: Replace with real API call to fetch blog post by slug
  // const post = await fetchBlogPostBySlug(slug);
  const post = null; // getBlogPostBySlug(slug);

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
