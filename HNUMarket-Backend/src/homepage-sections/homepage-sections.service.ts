import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';

/**
 * Homepage Sections Service
 *
 * Handles all homepage section CRUD operations and product resolution logic.
 * Uses Supabase Admin client to bypass RLS policies for admin operations.
 *
 * Core Features:
 * - CRUD operations for homepage sections
 * - Product resolution: manual selection + auto-fill
 * - Section reordering
 * - Public endpoint for storefront
 */
@Injectable()
export class HomepageSectionsService {
  private readonly logger = new Logger(HomepageSectionsService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Find all homepage sections with pagination and filters
   */
  async findAll(query: any) {
    const supabase = this.supabaseAdmin.getClient();
    const { page = 1, limit = 20, isActive } = query;

    let queryBuilder = supabase
      .from('homepage_sections')
      .select('*, category:categories(id, name, slug, image_url)', { count: 'exact' });

    if (isActive !== undefined) {
      const active = isActive === 'true';
      queryBuilder = queryBuilder.eq('is_active', active);
    }

    queryBuilder = queryBuilder
      .order('display_order', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch homepage sections: ${error.message}`);
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
   * Find single homepage section by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*, category:categories(id, name, slug, image_url)')
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Homepage section not found: ${id}`);
      throw new NotFoundException('Homepage section not found');
    }

    return data;
  }

  /**
   * Create new homepage section
   */
  async create(dto: any) {
    const supabase = this.supabaseAdmin.getClient();

    // Validate category exists
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', dto.categoryId)
      .single();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const { data: section, error } = await supabase
      .from('homepage_sections')
      .insert({
        category_id: dto.categoryId,
        display_order: dto.displayOrder ?? 0,
        is_active: dto.isActive ?? true,
        config: dto.config,
      })
      .select('*, category:categories(id, name, slug, image_url)')
      .single();

    if (error) {
      this.logger.error(`Failed to create homepage section: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Homepage section created: ${section.id}`);
    return section;
  }

  /**
   * Update existing homepage section
   */
  async update(id: string, dto: any) {
    const supabase = this.supabaseAdmin.getClient();

    // Check section exists
    await this.findOne(id);

    // Validate category if being updated
    if (dto.categoryId) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('id', dto.categoryId)
        .single();

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    if (dto.config !== undefined) updateData.config = dto.config;

    const { error } = await supabase
      .from('homepage_sections')
      .update(updateData)
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to update homepage section: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Homepage section updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Delete homepage section
   */
  async remove(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { error } = await supabase
      .from('homepage_sections')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete homepage section: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Homepage section deleted: ${id}`);
    return { message: 'Homepage section deleted successfully' };
  }

  /**
   * Reorder homepage sections
   *
   * Updates display_order for sections based on drag-drop order.
   */
  async reorder(dto: any) {
    const supabase = this.supabaseAdmin.getClient();
    const { ids } = dto;

    if (!ids || ids.length === 0) {
      throw new Error('No sections to reorder');
    }

    // Update display_order for each section based on its position in the array
    const updates = ids.map((id: string, index: number) => ({
      id,
      display_order: index,
    }));

    // Execute updates in parallel
    const promises = updates.map((update: any) =>
      supabase
        .from('homepage_sections')
        .update({
          display_order: update.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id),
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      this.logger.error(`Failed to reorder homepage sections: ${errors[0].error.message}`);
      throw new Error('Failed to reorder homepage sections');
    }

    this.logger.log(`Homepage sections reordered: ${ids.length} sections`);
    return { message: 'Homepage sections reordered successfully' };
  }

  /**
   * Preview products for a section (resolved: manual + auto-fill)
   *
   * Returns the section with resolved products (manual + auto-fill).
   * Used by admin to preview how section will look on storefront.
   */
  async previewProducts(id: string) {
    const section = await this.findOne(id);
    const products = await this.resolveProducts(section);

    return {
      section,
      products,
      meta: {
        total: products.length,
        manual_count: section.config.products.selected_product_ids.length,
        auto_fill_count: products.length - section.config.products.selected_product_ids.length,
      },
    };
  }

  /**
   * Enrich products with normalized variant details (options + variants with attributes)
   */
  private async enrichProductsWithVariants(products: any[]): Promise<any[]> {
    const supabase = this.supabaseAdmin.getClient();

    return Promise.all(
      products.map(async (product) => {
        // Fetch options with values
        const { data: options } = await supabase
          .from('product_options')
          .select('*, values:product_option_values(*)')
          .eq('product_id', product.id)
          .order('position', { ascending: true });

        // Fetch variants with attributes
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true);

        // For each variant, fetch attributes
        const variantsWithAttributes = await Promise.all(
          (variants || []).map(async (variant) => {
            const { data: attrData } = await supabase
              .from('product_variant_option_values')
              .select(
                `option_value:product_option_values(
                  id,
                  value,
                  option:product_options(name)
                )`,
              )
              .eq('variant_id', variant.id);

            // Build attributes object { "Size": "XL", "Color": "Blue" }
            const attributes: Record<string, string> = {};
            for (const item of attrData || []) {
              const optionValue = item.option_value as any;
              if (optionValue?.option?.name && optionValue?.value) {
                attributes[optionValue.option.name] = optionValue.value;
              }
            }

            return { ...variant, attributes };
          }),
        );

        return {
          ...product,
          options: options || [],
          variants: variantsWithAttributes || [],
        };
      }),
    );
  }

  /**
   * Resolve products for a section (manual + auto-fill)
   *
   * Core logic:
   * 1. Fetch manually selected products (preserve order)
   * 2. If auto-fill enabled and products < limit, fetch additional products
   * 3. Apply product_limit cap
   * 4. Enrich with normalized variant details (options + variants with attributes)
   */
  async resolveProducts(section: any): Promise<any[]> {
    const supabase = this.supabaseAdmin.getClient();
    const { config, category_id } = section;
    const { selected_product_ids, auto_fill } = config.products;
    const limit = config.layout.product_limit;

    let products: any[] = [];

    // Step 1: Fetch manually selected products (preserve order)
    if (selected_product_ids && selected_product_ids.length > 0) {
      const { data: manualProducts, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug), images:product_images(*)')
        .in('id', selected_product_ids)
        .eq('is_active', true);

      if (error) {
        this.logger.error(`Failed to fetch manual products: ${error.message}`);
      } else if (manualProducts) {
        // Preserve order from selected_product_ids
        const productMap = new Map(manualProducts.map((p: any) => [p.id, p]));
        products = selected_product_ids
          .map((id: string) => productMap.get(id))
          .filter((p: any) => p !== undefined);
      }
    }

    // Step 2: Auto-fill if enabled and needed
    if (auto_fill?.enabled && products.length < limit) {
      const remaining = limit - products.length;
      const excludeIds = products.map(p => p.id);

      const autoProducts = await this.getAutoFillProducts(
        category_id,
        auto_fill.criteria,
        remaining,
        excludeIds,
        auto_fill,
      );

      products.push(...autoProducts);
    }

    // Step 3: Apply product_limit cap
    products = products.slice(0, limit);

    // Step 4: Enrich with normalized variant details
    return this.enrichProductsWithVariants(products);
  }

  /**
   * Fetch auto-fill products based on criteria
   *
   * Supports: newest, best_selling, featured, random
   */
  private async getAutoFillProducts(
    categoryId: string,
    criteria: string,
    limit: number,
    excludeIds: string[],
    autoFillConfig: any,
  ): Promise<any[]> {
    const supabase = this.supabaseAdmin.getClient();

    let query = supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images:product_images(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true);

    // Exclude already selected products
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Exclude out of stock if configured
    if (autoFillConfig.exclude_out_of_stock) {
      query = query.gt('stock', 0);
    }

    // Apply min_stock filter if configured
    if (autoFillConfig.min_stock !== undefined && autoFillConfig.min_stock > 0) {
      query = query.gte('stock', autoFillConfig.min_stock);
    }

    // Apply sorting based on criteria
    switch (criteria) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'best_selling':
        query = query.order('sold', { ascending: false });
        break;
      case 'featured':
        query = query.eq('is_featured', true).order('created_at', { ascending: false });
        break;
      case 'random':
        // PostgreSQL random() function
        query = query.order('random()');
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch auto-fill products: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Get active homepage sections with resolved products for storefront
   *
   * Public endpoint that returns all active sections ordered by display_order,
   * with products resolved (manual + auto-fill) for each section.
   */
  async getActiveWithProducts() {
    const supabase = this.supabaseAdmin.getClient();

    // Fetch all active sections with category info
    const { data: sections, error } = await supabase
      .from('homepage_sections')
      .select('*, category:categories(id, name, slug, image_url)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch active homepage sections: ${error.message}`);
      throw new Error(error.message);
    }

    if (!sections || sections.length === 0) {
      return [];
    }

    // Resolve products for each section
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await this.resolveProducts(section);
        return {
          ...section,
          products,
        };
      }),
    );

    this.logger.debug(`Fetched ${sectionsWithProducts.length} active homepage sections`);
    return sectionsWithProducts;
  }
}
