import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeDate } from '@/lib/utils';
import { getImageUrl } from '@/lib/image';
import { Card } from '@/components/ui/card';
import { Package, User, Calendar } from 'lucide-react';
import { StorefrontPost } from '@/lib/api/storefront-posts';

interface BlogPostCardProps {
  post: StorefrontPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const authorName = post.author?.full_name || 'Admin';
  const displayDate = post.published_at || post.created_at;

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 h-full flex flex-col">
        {/* Thumbnail Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {post.cover_image_url ? (
            <Image
              src={getImageUrl(post.cover_image_url)}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-gray-50 to-blue-50">
              <Package className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category Badge */}
          {post.category && (
            <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full w-fit mb-2">
              {post.category}
            </span>
          )}

          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg line-clamp-2 min-h-[3rem] mb-2 group-hover:text-primary transition-colors duration-200">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-1">{post.excerpt}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatRelativeDate(displayDate)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}