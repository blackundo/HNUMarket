'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { getImageUrl } from '@/lib/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Package, ArrowLeft, Eye } from 'lucide-react';
import { StorefrontPost } from '@/lib/api/storefront-posts';

interface BlogPostContentProps {
  post: StorefrontPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const authorName = post.author?.full_name || 'Admin';
  const displayDate = post.published_at || post.created_at;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Blog</span>
      </Link>

      {/* Article Header */}
      <Card className="mb-6">
        <CardHeader className="space-y-4">
          {/* Category Badge */}
          {post.category && (
            <Badge variant="outline" className="w-fit">
              {post.category}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{post.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(displayDate)}</span>
            </div>
            {post.view_count > 0 && (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{post.view_count} lượt xem</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Featured Image */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-8">
        {post.cover_image_url ? (
          <Image
            src={getImageUrl(post.cover_image_url)}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-gray-50 to-blue-50">
            <Package className="w-24 h-24 text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="pt-6">
          {post.content ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : post.excerpt ? (
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Nội dung đang được cập nhật...</p>
          )}

          <Separator className="my-8" />

          {/* Footer Metadata */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Đăng ngày: {formatDate(post.created_at)}</p>
            {post.updated_at !== post.created_at && (
              <p>Cập nhật: {formatDate(post.updated_at)}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}