import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';
import { HeroSlideQueryDto } from './dto/hero-slide-query.dto';
import { ReorderHeroSlidesDto } from './dto/reorder-hero-slides.dto';

/**
 * Hero Slides Service
 *
 * Handles all hero slide CRUD operations using Supabase Admin client
 * to bypass RLS policies for admin operations.
 */
@Injectable()
export class HeroSlidesService {
  private readonly logger = new Logger(HeroSlidesService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Find all hero slides with pagination and filters
   */
  async findAll(query: HeroSlideQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const { page, limit, search, isActive, sortBy, sortOrder } = query;

    let queryBuilder = supabase
      .from('hero_slides')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('title', `%${search}%`);
    }
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }

    // Map sortBy to database column names
    const sortColumn =
      sortBy === 'created_at'
        ? 'created_at'
        : sortBy === 'display_order'
          ? 'display_order'
          : 'display_order';

    queryBuilder = queryBuilder
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch hero slides: ${error.message}`);
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
   * Find single hero slide by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Hero slide not found: ${id}`);
      throw new NotFoundException('Hero slide not found');
    }

    return data;
  }

  /**
   * Create new hero slide
   */
  async create(dto: CreateHeroSlideDto) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: heroSlide, error } = await supabase
      .from('hero_slides')
      .insert({
        title: dto.title,
        subtitle: dto.subtitle,
        image_url: dto.imageUrl,
        gradient: dto.gradient,
        link: dto.link,
        display_order: dto.displayOrder ?? 0,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create hero slide: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Hero slide created: ${heroSlide.id}`);
    return heroSlide;
  }

  /**
   * Update existing hero slide
   */
  async update(id: string, dto: UpdateHeroSlideDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check hero slide exists
    await this.findOne(id);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
    if (dto.gradient !== undefined) updateData.gradient = dto.gradient;
    if (dto.link !== undefined) updateData.link = dto.link;
    if (dto.displayOrder !== undefined)
      updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { error } = await supabase
      .from('hero_slides')
      .update(updateData)
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to update hero slide: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Hero slide updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Delete hero slide
   */
  async remove(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Check hero slide exists
    await this.findOne(id);

    const { error } = await supabase.from('hero_slides').delete().eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete hero slide: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Hero slide deleted: ${id}`);
    return { message: 'Hero slide deleted' };
  }

  /**
   * Reorder hero slides
   */
  async reorder(dto: ReorderHeroSlidesDto) {
    const supabase = this.supabaseAdmin.getClient();
    const { ids } = dto;

    // Update display_order for each slide based on its position in the array
    const updates = ids.map((id, index) => ({
      id,
      display_order: index,
    }));

    // Execute updates in parallel
    const promises = updates.map((update) =>
      supabase
        .from('hero_slides')
        .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
        .eq('id', update.id),
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      this.logger.error(`Failed to reorder hero slides: ${errors[0].error.message}`);
      throw new Error('Failed to reorder hero slides');
    }

    this.logger.log(`Hero slides reordered: ${ids.length} slides`);
    return { message: 'Hero slides reordered successfully' };
  }

  /**
   * Get active hero slides for storefront (public)
   */
  async getActiveSlides() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch active hero slides: ${error.message}`);
      throw new Error(error.message);
    }

    return data || [];
  }
}
