import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreatePostDto, PostStatus } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';

/**
 * Posts Service
 *
 * Handles CRUD operations for blog posts with Supabase.
 * Includes slug generation, excerpt creation, and publish/unpublish functionality.
 */
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Generate SEO-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Generate excerpt from content (first 200 chars, stripped of HTML)
   */
  private generateExcerpt(content: string, maxLength = 200): string {
    const text = this.stripHtml(content);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  /**
   * Get all posts with pagination and filtering
   */
  async findAll(query: PostQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const { page, limit, search, status, category, sortBy, sortOrder } = query;

    let queryBuilder = supabase
      .from('posts')
      .select('*, author:profiles(id, full_name, avatar_url)', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('title', `%${search}%`);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const orderColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'publishedAt'
          ? 'published_at'
          : sortBy === 'viewCount'
            ? 'view_count'
            : sortBy;

    queryBuilder = queryBuilder
      .order(orderColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch posts: ${error.message}`);
      throw new Error(error.message);
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get single post by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles(id, full_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Post not found: ${id}`);
      throw new NotFoundException('Post not found');
    }

    return data;
  }

  /**
   * Create new post
   */
  async create(dto: CreatePostDto, authorId: string) {
    const supabase = this.supabaseAdmin.getClient();
    const slug = this.generateSlug(dto.title);
    const excerpt = dto.excerpt || (dto.content ? this.generateExcerpt(dto.content) : null);

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        slug,
        title: dto.title,
        excerpt,
        content: dto.content,
        cover_image_url: dto.coverImageUrl,
        author_id: authorId,
        category: dto.category,
        tags: dto.tags || [],
        status: dto.status || PostStatus.DRAFT,
        published_at: dto.status === PostStatus.PUBLISHED ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create post: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Post created: ${post.id}`);
    return this.findOne(post.id);
  }

  /**
   * Update existing post
   */
  async update(id: string, dto: UpdatePostDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check post exists
    const existing = await this.findOne(id);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) {
      updateData.title = dto.title;
      updateData.slug = this.generateSlug(dto.title);
    }
    if (dto.content !== undefined) {
      updateData.content = dto.content;
      if (!dto.excerpt) {
        updateData.excerpt = this.generateExcerpt(dto.content);
      }
    }
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.coverImageUrl !== undefined) updateData.cover_image_url = dto.coverImageUrl;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      // Set published_at when publishing for first time
      if (dto.status === PostStatus.PUBLISHED && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { error } = await supabase.from('posts').update(updateData).eq('id', id);

    if (error) {
      this.logger.error(`Failed to update post ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Post updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Delete post (soft delete via archiving)
   */
  async remove(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Soft delete by archiving
    const { error } = await supabase
      .from('posts')
      .update({
        status: PostStatus.ARCHIVED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to archive post ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Post archived: ${id}`);
    return { message: 'Post archived' };
  }

  /**
   * Publish post
   */
  async publish(id: string) {
    this.logger.log(`Publishing post: ${id}`);
    return this.update(id, { status: PostStatus.PUBLISHED });
  }

  /**
   * Unpublish post
   */
  async unpublish(id: string) {
    this.logger.log(`Unpublishing post: ${id}`);
    return this.update(id, { status: PostStatus.DRAFT });
  }
}
