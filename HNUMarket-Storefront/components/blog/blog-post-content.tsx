import { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Package } from "lucide-react";

interface BlogPostContentProps {
  post: BlogPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <Card className="mb-6">
        <CardHeader className="space-y-4">
          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
            {post.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.date)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Image */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-8">
        {/* Placeholder image */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-gray-50 to-blue-50">
          <Package className="w-24 h-24 text-gray-300" strokeWidth={1.5} />
        </div>
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {post.content}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Footer Metadata */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Đăng ngày: {formatDate(post.createdAt)}</p>
            {post.updatedAt !== post.createdAt && (
              <p>Cập nhật: {formatDate(post.updatedAt)}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
