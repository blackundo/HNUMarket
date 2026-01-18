import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

/**
 * Storefront Posts Query DTO
 */
export interface StorefrontPostsQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
}

/**
 * Storefront Posts Service
 *
 * Public API for blog posts on storefront.
 * Only returns published posts - no authentication required.
 */
@Injectable()
export class StorefrontPostsService {
    private readonly logger = new Logger(StorefrontPostsService.name);

    constructor(private supabaseAdmin: SupabaseAdminService) { }

    /**
     * Get all published posts with pagination
     */
    async findAll(query: StorefrontPostsQueryDto) {
        const supabase = this.supabaseAdmin.getClient();
        const page = query.page || 1;
        const limit = query.limit || 10;

        let queryBuilder = supabase
            .from('posts')
            .select('*, author:profiles(id, full_name, avatar_url)', { count: 'exact' })
            .eq('status', 'published'); // Only published posts

        // Search filter
        if (query.search) {
            queryBuilder = queryBuilder.or(
                `title.ilike.%${query.search}%,excerpt.ilike.%${query.search}%`,
            );
        }

        // Category filter
        if (query.category) {
            queryBuilder = queryBuilder.eq('category', query.category);
        }

        // Tag filter
        if (query.tag) {
            queryBuilder = queryBuilder.contains('tags', [query.tag]);
        }

        // Order by published_at desc (newest first)
        queryBuilder = queryBuilder
            .order('published_at', { ascending: false, nullsFirst: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to fetch posts: ${error.message}`);
            throw new Error(error.message);
        }

        return {
            data: data || [],
            meta: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    }

    /**
     * Get single post by slug (public)
     * Increments view count
     */
    async findBySlug(slug: string) {
        const supabase = this.supabaseAdmin.getClient();

        // Get post
        const { data, error } = await supabase
            .from('posts')
            .select('*, author:profiles(id, full_name, avatar_url)')
            .eq('slug', slug)
            .eq('status', 'published') // Only published posts
            .single();

        if (error || !data) {
            this.logger.warn(`Post not found: ${slug}`);
            throw new NotFoundException('Post not found');
        }

        // Increment view count (fire and forget)
        this.incrementViewCount(data.id, slug);

        return data;
    }

    /**
     * Increment view count for a post (fire and forget)
     */
    private async incrementViewCount(postId: string, slug: string): Promise<void> {
        try {
            const supabase = this.supabaseAdmin.getClient();
            // Get current view count and increment
            const { data: post } = await supabase
                .from('posts')
                .select('view_count')
                .eq('id', postId)
                .single();

            const newCount = (post?.view_count || 0) + 1;

            await supabase
                .from('posts')
                .update({ view_count: newCount })
                .eq('id', postId);

            this.logger.debug(`View count incremented for post: ${slug} (${newCount})`);
        } catch (err: any) {
            this.logger.warn(`Failed to increment view count for: ${slug} - ${err?.message || 'Unknown error'}`);
        }
    }

    /**
     * Get recent posts
     */
    async getRecentPosts(limit: number = 5) {
        const result = await this.findAll({ page: 1, limit });
        return result.data;
    }

    /**
     * Get related posts by category (excluding current post)
     */
    async getRelatedPosts(category: string, excludeId: string, limit: number = 4) {
        const supabase = this.supabaseAdmin.getClient();

        const { data, error } = await supabase
            .from('posts')
            .select('*, author:profiles(id, full_name, avatar_url)')
            .eq('status', 'published')
            .eq('category', category)
            .neq('id', excludeId)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to fetch related posts: ${error.message}`);
            return [];
        }

        return data || [];
    }
}