import Link from "next/link";
import { BlogPost } from "@/types";
import { formatRelativeDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Package, User, Calendar } from "lucide-react";

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200">
        {/* Thumbnail Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {/* Placeholder image */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-gray-50 to-blue-50">
            <Package className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg line-clamp-2 min-h-[3rem] mb-2 group-hover:text-primary transition-colors duration-200">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {post.excerpt}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatRelativeDate(post.date)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
