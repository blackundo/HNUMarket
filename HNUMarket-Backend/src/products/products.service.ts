import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { TrashQueryDto } from './dto/trash-query.dto';

/**
 * Products Service
 *
 * Handles all product CRUD operations using Supabase Admin client
 * to bypass RLS policies for admin operations.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) {}

  /**
   * Generate URL-friendly slug from product name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Find all products with pagination and filters
   */
  async findAll(query: ProductQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const {
      page,
      limit,
      search,
      categoryId,
      isActive,
      isFeatured,
      sortBy,
      sortOrder,
    } = query;

    let queryBuilder = supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
        { count: 'exact' },
      );

    if (search) {
      queryBuilder = queryBuilder.ilike('name', `%${search}%`);
    }
    if (categoryId) {
      queryBuilder = queryBuilder.eq('category_id', categoryId);
    }
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }
    if (isFeatured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', isFeatured);
    }

    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
    queryBuilder = queryBuilder
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
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
   * Check if slug is available
   */
  async checkSlugAvailability(slug: string, excludeId?: string) {
    const supabase = this.supabaseAdmin.getClient();

    let query = supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Failed to check slug availability: ${error.message}`);
      throw new Error(error.message);
    }

    return {
      available: !data || data.length === 0,
    };
  }

  /**
   * Find single product by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Product not found: ${id}`);
      throw new NotFoundException('Product not found');
    }

    return data;
  }

  /**
   * Create new product with images and variants
   */
  async create(dto: CreateProductDto) {
    const supabase = this.supabaseAdmin.getClient();
    // Use provided slug or auto-generate from name
    const slug = dto.slug?.trim() || this.generateSlug(dto.name);

    // Check if slug already exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      this.logger.error(`Failed to check slug availability: ${checkError.message}`);
      throw new Error(checkError.message);
    }

    if (existing) {
      throw new BadRequestException('Product with this slug already exists');
    }

    // Stock logic: If product has variants, set product stock to 0 (use variant stocks instead)
    const hasVariants = dto.variants && dto.variants.length > 0;
    const productStock = hasVariants ? 0 : (dto.stock || 0);

    if (hasVariants && dto.stock && dto.stock > 0) {
      this.logger.warn(
        `Product "${dto.name}" has variants. Setting product stock to 0. Use variant stocks instead.`
      );
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        slug,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        original_price: dto.originalPrice,
        meta_title: dto.metaTitle,
        meta_description: dto.metaDescription,
        sku: dto.sku,
        category_id: dto.categoryId,
        stock: productStock,
        location: dto.location,
        badges: dto.badges || [],
        specifications: dto.specifications || {},
        is_active: dto.isActive ?? true,
        is_featured: dto.isFeatured ?? false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new Error(error.message);
    }

    // Add images
    if (dto.imageUrls?.length) {
      const images = dto.imageUrls.map((url, index) => ({
        product_id: product.id,
        url,
        display_order: index,
      }));
      const { error: imgError } = await supabase
        .from('product_images')
        .insert(images);
      if (imgError) {
        this.logger.error(`Failed to add images: ${imgError.message}`);
      }
    }

    // Add variants
    if (dto.variants?.length) {
      const variants = dto.variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        display_name: v.displayName || v.name,
        type: v.type || 'unit',
        value: v.value || v.unit,
        unit: v.unit,
        conversion_rate: v.conversionRate,
        stock: v.stock,
        price: v.price,
        price_adjustment: v.priceAdjustment || 0, // Deprecated but kept for compatibility
      }));
      const { error: varError } = await supabase
        .from('product_variants')
        .insert(variants);
      if (varError) {
        this.logger.error(`Failed to add variants: ${varError.message}`);
      }
    }

    this.logger.log(`Product created: ${product.id}`);
    return this.findOne(product.id);
  }

  /**
   * Update existing product
   */
  async update(id: string, dto: UpdateProductDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check product exists
    await this.findOne(id);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) {
      updateData.name = dto.name;
      // Only auto-generate slug if slug is not provided
      if (dto.slug === undefined) {
        updateData.slug = this.generateSlug(dto.name);
      }
    }
    
    // Handle slug update if provided
    if (dto.slug !== undefined) {
      const newSlug = dto.slug.trim();
      // Check if slug already exists (excluding current product)
      const { data: existing, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        this.logger.error(`Failed to check slug availability: ${checkError.message}`);
        throw new Error(checkError.message);
      }

      if (existing) {
        throw new BadRequestException('Product with this slug already exists');
      }
      updateData.slug = newSlug;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.originalPrice !== undefined)
      updateData.original_price = dto.originalPrice;
    if (dto.metaTitle !== undefined) updateData.meta_title = dto.metaTitle;
    if (dto.metaDescription !== undefined)
      updateData.meta_description = dto.metaDescription;
    if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId;
    if (dto.stock !== undefined) updateData.stock = dto.stock;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.badges !== undefined) updateData.badges = dto.badges;
    if (dto.specifications !== undefined)
      updateData.specifications = dto.specifications;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    if (dto.isFeatured !== undefined) updateData.is_featured = dto.isFeatured;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to update product: ${error.message}`);
      throw new Error(error.message);
    }

    // Update images if provided
    if (dto.imageUrls !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (dto.imageUrls.length) {
        const images = dto.imageUrls.map((url, index) => ({
          product_id: id,
          url,
          display_order: index,
        }));
        await supabase.from('product_images').insert(images);
      }
    }

    // Update variants if provided
    if (dto.variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id);
      if (dto.variants.length) {
        const variants = dto.variants.map((v) => ({
          product_id: id,
          name: v.name,
          display_name: v.displayName || v.name,
          type: v.type || 'unit',
          value: v.value || v.unit,
          unit: v.unit,
          conversion_rate: v.conversionRate,
          stock: v.stock,
          price: v.price,
          price_adjustment: v.priceAdjustment || 0, // Deprecated but kept for compatibility
        }));
        await supabase.from('product_variants').insert(variants);

        // Stock logic: If product now has variants, set product stock to 0
        if (dto.stock === undefined || dto.stock > 0) {
          this.logger.warn(
            `Product ${id} now has variants. Setting product stock to 0. Use variant stocks instead.`
          );
          await supabase
            .from('products')
            .update({ stock: 0 })
            .eq('id', id);
        }
      }
    }

    this.logger.log(`Product updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Move product to trash (replaces old soft delete)
   */
  async moveToTrash(id: string, deletedByUserId?: string) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Fetch product with images and variants
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*, images:product_images(*), variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check if product already in trash (by slug)
    const { data: existingTrash } = await supabase
      .from('product_trash')
      .select('id')
      .eq('slug', product.slug)
      .maybeSingle();

    if (existingTrash) {
      throw new BadRequestException('Product with this slug already in trash');
    }

    // 3. Insert into trash table
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const { error: trashError } = await supabase
      .from('product_trash')
      .insert({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        category_id: product.category_id,
        stock: product.stock,
        rating: product.rating,
        review_count: product.review_count,
        sold: product.sold,
        location: product.location,
        badges: product.badges,
        specifications: product.specifications,
        is_active: product.is_active,
        is_featured: product.is_featured,
        product_created_at: product.created_at,
        product_updated_at: product.updated_at,
        images: product.images || [],
        variants: product.variants || [],
        deleted_by: deletedByUserId || null,
        deleted_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (trashError) {
      this.logger.error(`Failed to move to trash: ${trashError.message}`);
      throw new Error(trashError.message);
    }

    // 4. Delete from products table (CASCADE deletes images/variants)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // Rollback: delete from trash
      await supabase.from('product_trash').delete().eq('id', id);
      throw new Error(deleteError.message);
    }

    this.logger.log(`Product moved to trash: ${id}`);
    return {
      message: 'Product moved to trash',
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Restore product from trash
   */
  async restore(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Fetch from trash
    const { data: trashed, error: fetchError } = await supabase
      .from('product_trash')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !trashed) {
      throw new NotFoundException('Product not found in trash');
    }

    // 2. Check if slug conflicts with existing product
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', trashed.slug)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException(
        'Cannot restore: a product with the same slug already exists',
      );
    }

    // 3. Insert back to products table
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        id: trashed.id,
        slug: trashed.slug,
        name: trashed.name,
        description: trashed.description,
        price: trashed.price,
        original_price: trashed.original_price,
        meta_title: trashed.meta_title,
        meta_description: trashed.meta_description,
        category_id: trashed.category_id,
        stock: trashed.stock,
        rating: trashed.rating,
        review_count: trashed.review_count,
        sold: trashed.sold,
        location: trashed.location,
        badges: trashed.badges,
        specifications: trashed.specifications,
        is_active: trashed.is_active,
        is_featured: trashed.is_featured,
        created_at: trashed.product_created_at,
      })
      .select()
      .single();

    if (insertError) {
      this.logger.error(`Failed to restore product: ${insertError.message}`);
      throw new Error(insertError.message);
    }

    // 4. Restore images
    const images = trashed.images as Array<{
      url: string;
      alt_text: string;
      display_order: number;
    }>;
    if (images?.length) {
      const imageInserts = images.map((img) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text,
        display_order: img.display_order,
      }));
      await supabase.from('product_images').insert(imageInserts);
    }

    // 5. Restore variants
    const variants = trashed.variants as Array<Record<string, unknown>>;
    if (variants?.length) {
      const variantInserts = variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        display_name: v.display_name,
        type: v.type,
        value: v.value,
        unit: v.unit,
        conversion_rate: v.conversion_rate,
        stock: v.stock,
        price: v.price,
        price_adjustment: v.price_adjustment,
      }));
      await supabase.from('product_variants').insert(variantInserts);
    }

    // 6. Remove from trash
    await supabase.from('product_trash').delete().eq('id', id);

    this.logger.log(`Product restored from trash: ${id}`);
    return this.findOne(product.id);
  }

  /**
   * Permanently delete from trash (with storage cleanup)
   */
  async permanentDelete(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Fetch product to get images for storage cleanup
    const { data: trashedProduct, error: fetchError } = await supabase
      .from('product_trash')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !trashedProduct) {
      throw new NotFoundException('Product not found in trash');
    }

    // 2. Delete from trash table
    const { error: deleteError } = await supabase
      .from('product_trash')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // 3. Clean up images from storage
    const images = trashedProduct.images as Array<{ url: string }>;
    if (images?.length) {
      for (const img of images) {
        try {
          const path = this.extractStoragePath(img.url);
          if (path) {
            await supabase.storage.from('products').remove([path]);
          }
        } catch (error) {
          this.logger.warn(`Failed to delete image from storage: ${img.url}`);
        }
      }
    }

    this.logger.log(`Product permanently deleted: ${id}`);
    return {
      message: 'Product permanently deleted',
      id: trashedProduct.id,
      name: trashedProduct.name,
    };
  }

  /**
   * List products in trash
   */
  async findTrash(query: TrashQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'deleted_at',
      sortOrder = 'desc',
    } = query;

    let queryBuilder = supabase
      .from('product_trash')
      .select('*', { count: 'exact' });

    if (search) {
      queryBuilder = queryBuilder.ilike('name', `%${search}%`);
    }

    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
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
   * Empty entire trash (with storage cleanup)
   */
  async emptyTrash() {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Fetch all trash items for storage cleanup and count
    const { data: allTrash, error: fetchError } = await supabase
      .from('product_trash')
      .select('*');

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const count = allTrash?.length || 0;

    // 2. Delete all from trash
    const { error: deleteError } = await supabase
      .from('product_trash')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // 3. Clean up images from storage
    if (allTrash?.length) {
      for (const item of allTrash) {
        const images = item.images as Array<{ url: string }>;
        if (images?.length) {
          for (const img of images) {
            try {
              const path = this.extractStoragePath(img.url);
              if (path) {
                await supabase.storage.from('products').remove([path]);
              }
            } catch (error) {
              this.logger.warn(`Failed to delete image from storage: ${img.url}`);
            }
          }
        }
      }
    }

    this.logger.log(`Trash emptied: ${count} products permanently deleted`);
    return { message: 'Trash emptied', deletedCount: count };
  }

  /**
   * Bulk move products to trash
   */
  async bulkMoveToTrash(ids: string[], deletedByUserId?: string) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of ids) {
      try {
        await this.moveToTrash(id, deletedByUserId);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Bulk trash: ${results.success.length} succeeded, ${results.failed.length} failed`,
    );
    return results;
  }

  /**
   * Bulk restore products from trash
   */
  async bulkRestore(ids: string[]) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of ids) {
      try {
        await this.restore(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Bulk restore: ${results.success.length} succeeded, ${results.failed.length} failed`,
    );
    return results;
  }

  /**
   * Extract storage path from Supabase storage URL
   */
  private extractStoragePath(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)$/);
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  }
}
