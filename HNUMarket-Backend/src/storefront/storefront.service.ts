import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { StorefrontProductQueryDto } from './dto/storefront-product-query.dto';

/**
 * Storefront Service
 *
 * Handles all public storefront operations.
 * Returns only active products for public consumption.
 */
@Injectable()
export class StorefrontService {
  private readonly logger = new Logger(StorefrontService.name);

  constructor(private supabaseAdmin: SupabaseAdminService) { }

  /**
   * Find all active products with pagination and filters
   * Public endpoint - only returns is_active = true products
   */
  async findAllProducts(query: StorefrontProductQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const {
      page,
      limit,
      search,
      category_id,
      min_price,
      max_price,
      sort_by,
      sort_order,
    } = query;

    let queryBuilder = supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
        { count: 'exact' },
      )
      .eq('is_active', true); // Only active products

    if (search) {
      queryBuilder = queryBuilder.ilike('name', `%${search}%`);
    }
    if (category_id) {
      queryBuilder = queryBuilder.eq('category_id', category_id);
    }
    if (min_price !== undefined) {
      queryBuilder = queryBuilder.gte('price', min_price);
    }
    if (max_price !== undefined) {
      queryBuilder = queryBuilder.lte('price', max_price);
    }

    queryBuilder = queryBuilder
      .order(sort_by, { ascending: sort_order === 'asc' })
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
   * Find single product by ID
   * Public endpoint - only returns active products
   */
  async findProductById(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (productError) {
      this.logger.error(`Error fetching product by ID "${id}": ${productError.message}`);

      if (productError.code === 'PGRST116') {
        throw new NotFoundException(`Product with ID "${id}" not found`);
      }
      throw new NotFoundException(`Product not found: ${productError.message}`);
    }

    if (!productData) {
      this.logger.warn(`Product not found: ${id}`);
      throw new NotFoundException('Product not found');
    }

    // Fetch related data
    const categoryId = productData.category_id;
    const productId = productData.id;

    let category = null;
    if (categoryId) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', categoryId)
        .single();
      category = catData;
    }

    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    return {
      ...productData,
      category,
      images: images || [],
      variants: variants || [],
    };
  }

  /**
   * Find multiple products by IDs
   * Public endpoint - only returns active products
   */
  async findProductsByIds(ids: string[]) {
    const supabase = this.supabaseAdmin.getClient();

    if (!ids || ids.length === 0) {
      return [];
    }

    const { data: products, error } = await supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
      )
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      this.logger.error(`Failed to fetch products by IDs: ${error.message}`);
      throw new Error(error.message);
    }

    return products || [];
  }

  /**
   * Find single product by slug
   * Public endpoint - only returns active products
   */
  async findProductBySlug(slug: string) {
    const supabase = this.supabaseAdmin.getClient();

    // First, try to get the product without relations to debug
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (productError) {
      this.logger.error(`Error fetching product by slug "${slug}": ${productError.message}`);
      this.logger.error(`Error code: ${productError.code}, details: ${JSON.stringify(productError)}`);

      // Check if it's a "not found" error (PGRST116) or other error
      if (productError.code === 'PGRST116') {
        throw new NotFoundException(`Product with slug "${slug}" not found`);
      }
      throw new NotFoundException(`Product not found: ${productError.message}`);
    }

    if (!productData) {
      this.logger.warn(`Product not found: ${slug}`);
      throw new NotFoundException('Product not found');
    }

    // Now fetch related data separately to avoid RLS issues
    const categoryId = productData.category_id;
    const productId = productData.id;

    // Fetch category
    let category = null;
    if (categoryId) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', categoryId)
        .single();
      category = catData;
    }

    // Fetch images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    // Fetch variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    // Combine all data
    return {
      ...productData,
      category,
      images: images || [],
      variants: variants || [],
    };
  }

  /**
   * Get featured products
   * Returns products with is_featured = true
   */
  async getFeaturedProducts(limit: number = 8) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
      )
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Failed to fetch featured products: ${error.message}`);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get flash sale products
   * Returns products with original_price > price (discount)
   */
  async getFlashSaleProducts(limit: number = 8) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('products')
      .select(
        '*, category:categories(id, name, slug), images:product_images(*), variants:product_variants(*)',
      )
      .eq('is_active', true)
      .not('original_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Failed to fetch flash sale products: ${error.message}`);
      throw new Error(error.message);
    }

    // Filter products where original_price > price
    const flashSaleProducts = data.filter(
      (p) => p.original_price && p.original_price > p.price,
    );

    return flashSaleProducts.slice(0, limit);
  }

  /**
   * Get all categories
   * Public endpoint - returns all active categories
   */
  async getAllCategories() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get single category by slug
   * Public endpoint - returns category details
   */
  async getCategoryBySlug(slug: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !category) {
      this.logger.warn(`Category not found: ${slug}`);
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  /**
   * Get products by category slug
   * Public endpoint - returns active products in category
   */
  async getProductsByCategorySlug(
    slug: string,
    query: StorefrontProductQueryDto,
  ) {
    const supabase = this.supabaseAdmin.getClient();

    // First find category by slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      this.logger.warn(`Category not found: ${slug}`);
      throw new NotFoundException('Category not found');
    }

    // Use existing findAllProducts with category_id filter
    return this.findAllProducts({
      ...query,
      category_id: category.id,
    });
  }

  /**
   * Get active shipping locations
   * Public endpoint - returns only active locations sorted by display_order
   */
  async getShippingLocations() {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('shipping_locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      this.logger.error(`Failed to fetch shipping locations: ${error.message}`);
      throw new Error(error.message);
    }

    return data || [];
  }
}
