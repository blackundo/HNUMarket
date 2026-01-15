import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreatePageDto, PageStatus } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';

/**
 * Pages Service
 *
 * Handles CRUD operations for static pages with Supabase.
 */
@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Generate SEO-friendly slug from title or custom input
   */
  private generateSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private resolveSlug(title: string, slug?: string) {
    return slug ? this.generateSlug(slug) : this.generateSlug(title);
  }

  /**
   * Get all pages with pagination and filtering (admin)
   */
  async findAll(query: PageQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const { page, limit, search, status, sortBy, sortOrder } = query;

    let queryBuilder = supabase
      .from('pages')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('title', `%${search}%`);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const orderColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'publishedAt'
          ? 'published_at'
          : sortBy;

    queryBuilder = queryBuilder
      .order(orderColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch pages: ${error.message}`);
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
   * Get single page by ID (admin)
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Page not found: ${id}`);
      throw new NotFoundException('Page not found');
    }

    return data;
  }

  /**
   * Get published page by slug (public)
   */
  async findPublishedBySlug(slug: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', PageStatus.PUBLISHED)
      .single();

    if (error || !data) {
      this.logger.warn(`Published page not found: ${slug}`);
      throw new NotFoundException('Page not found');
    }

    return data;
  }

  /**
   * List published pages for storefront (public)
   */
  async findPublishedPages() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', PageStatus.PUBLISHED)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch published pages: ${error.message}`);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Create new page
   */
  async create(dto: CreatePageDto) {
    const supabase = this.supabaseAdmin.getClient();
    const slug = this.resolveSlug(dto.title, dto.slug);

    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        slug,
        title: dto.title,
        content: dto.content,
        meta_title: dto.metaTitle,
        meta_description: dto.metaDescription,
        status: dto.status || PageStatus.DRAFT,
        published_at:
          dto.status === PageStatus.PUBLISHED ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create page: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Page created: ${page.id}`);
    return this.findOne(page.id);
  }

  /**
   * Update existing page
   */
  async update(id: string, dto: UpdatePageDto) {
    const supabase = this.supabaseAdmin.getClient();

    const existing = await this.findOne(id);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) {
      updateData.title = dto.title;
      if (dto.slug === undefined) {
        updateData.slug = this.resolveSlug(dto.title);
      }
    }
    if (dto.slug !== undefined) updateData.slug = this.resolveSlug(dto.title || existing.title, dto.slug);
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.metaTitle !== undefined) updateData.meta_title = dto.metaTitle;
    if (dto.metaDescription !== undefined) updateData.meta_description = dto.metaDescription;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === PageStatus.PUBLISHED && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { error } = await supabase.from('pages').update(updateData).eq('id', id);

    if (error) {
      this.logger.error(`Failed to update page ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Page updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Delete page (soft delete via archiving)
   */
  async remove(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    await this.findOne(id);

    const { error } = await supabase
      .from('pages')
      .update({
        status: PageStatus.ARCHIVED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to archive page ${id}: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Page archived: ${id}`);
    return { message: 'Page archived' };
  }

  /**
   * Publish page
   */
  async publish(id: string) {
    this.logger.log(`Publishing page: ${id}`);
    return this.update(id, { status: PageStatus.PUBLISHED });
  }

  /**
   * Unpublish page
   */
  async unpublish(id: string) {
    this.logger.log(`Unpublishing page: ${id}`);
    return this.update(id, { status: PageStatus.DRAFT });
  }
}
