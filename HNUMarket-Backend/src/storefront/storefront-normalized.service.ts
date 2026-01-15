import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { StorefrontProductQueryDto } from './dto/storefront-product-query.dto';

/**
 * Storefront Service (Normalized Multi-Attribute Variants)
 *
 * Handles public storefront operations with new normalized variant schema.
 * Returns only active products with complete option/variant structure.
 *
 * Performance optimizations:
 * - Batch fetching to reduce N+1 queries
 * - In-memory caching for featured/flash-sale products
 * - Reduces database queries by 80-90%
 */
@Injectable()
export class StorefrontNormalizedService {
  private readonly logger = new Logger(StorefrontNormalizedService.name);

  constructor(
    private supabaseAdmin: SupabaseAdminService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Batch fetch options for multiple products
   * Reduces N queries to 1 query
   */
  private async batchFetchProductOptions(productIds: string[]) {
    if (!productIds || productIds.length === 0) return {};

    const supabase = this.supabaseAdmin.getClient();

    const { data: options, error } = await supabase
      .from('product_options')
      .select('*, values:product_option_values(*)')
      .in('product_id', productIds)
      .order('position', { ascending: true });

    if (error) {
      this.logger.error(`Failed to batch fetch options: ${error.message}`);
      return {};
    }

    // Group options by product_id
    const optionsByProduct: Record<string, any[]> = {};
    for (const option of options || []) {
      const productId = option.product_id;
      if (!optionsByProduct[productId]) {
        optionsByProduct[productId] = [];
      }
      optionsByProduct[productId].push(option);
    }

    return optionsByProduct;
  }

  /**
   * Batch fetch variants for multiple products
   * Reduces N queries to 1 query
   */
  private async batchFetchProductVariants(productIds: string[]) {
    if (!productIds || productIds.length === 0) return {};

    const supabase = this.supabaseAdmin.getClient();

    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .eq('is_active', true);

    if (error) {
      this.logger.error(`Failed to batch fetch variants: ${error.message}`);
      return {};
    }

    // Group variants by product_id
    const variantsByProduct: Record<string, any[]> = {};
    for (const variant of variants || []) {
      const productId = variant.product_id;
      if (!variantsByProduct[productId]) {
        variantsByProduct[productId] = [];
      }
      variantsByProduct[productId].push(variant);
    }

    return variantsByProduct;
  }

  /**
   * Batch fetch variant attributes for multiple variants
   * Reduces N queries to 1 query
   */
  private async batchFetchVariantAttributes(variantIds: string[]) {
    if (!variantIds || variantIds.length === 0) return {};

    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('product_variant_option_values')
      .select(
        `
        variant_id,
        option_value:product_option_values(
          id,
          value,
          option:product_options(name)
        )
      `,
      )
      .in('variant_id', variantIds);

    if (error) {
      this.logger.error(
        `Failed to batch fetch variant attributes: ${error.message}`,
      );
      return {};
    }

    // Group attributes by variant_id
    const attributesByVariant: Record<string, Record<string, string>> = {};
    for (const item of data || []) {
      const variantId = item.variant_id;
      const optionValue = item.option_value as any;

      if (!attributesByVariant[variantId]) {
        attributesByVariant[variantId] = {};
      }

      if (optionValue?.option?.name && optionValue?.value) {
        attributesByVariant[variantId][optionValue.option.name] =
          optionValue.value;
      }
    }

    return attributesByVariant;
  }

  /**
   * Get product details with options and variants (single product)
   * Used for single product fetch (by ID or slug)
   */
  private async getProductDetails(productId: string) {
    const optionsMap = await this.batchFetchProductOptions([productId]);
    const variantsMap = await this.batchFetchProductVariants([productId]);

    const options = optionsMap[productId] || [];
    const variants = variantsMap[productId] || [];

    // Batch fetch attributes for all variants
    const variantIds = variants.map((v) => v.id);
    const attributesMap = await this.batchFetchVariantAttributes(variantIds);

    // Attach attributes to each variant
    const variantsWithAttributes = variants.map((variant) => ({
      ...variant,
      attributes: attributesMap[variant.id] || {},
    }));

    return {
      options,
      variants: variantsWithAttributes,
    };
  }

  /**
   * Batch get product details for multiple products
   * Optimized for list endpoints (findAllProducts, getFeaturedProducts, etc.)
   */
  private async batchGetProductDetails(productIds: string[]) {
    if (!productIds || productIds.length === 0) return {};

    // Batch fetch all data in parallel
    const [optionsMap, variantsMap] = await Promise.all([
      this.batchFetchProductOptions(productIds),
      this.batchFetchProductVariants(productIds),
    ]);

    // Collect all variant IDs across all products
    const allVariantIds: string[] = [];
    for (const productId of productIds) {
      const variants = variantsMap[productId] || [];
      allVariantIds.push(...variants.map((v) => v.id));
    }

    // Batch fetch attributes for all variants at once
    const attributesMap = await this.batchFetchVariantAttributes(allVariantIds);

    // Build the result map
    const detailsMap: Record<string, any> = {};
    for (const productId of productIds) {
      const options = optionsMap[productId] || [];
      const variants = variantsMap[productId] || [];

      const variantsWithAttributes = variants.map((variant) => ({
        ...variant,
        attributes: attributesMap[variant.id] || {},
      }));

      detailsMap[productId] = {
        options,
        variants: variantsWithAttributes,
      };
    }

    return detailsMap;
  }

  /**
   * Find all active products with pagination
   * Optimized: 3-4 queries instead of 100+ queries
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
        '*, category:categories(id, name, slug), images:product_images(*)',
        { count: 'exact' },
      )
      .eq('is_active', true);

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

    // Batch fetch options and variants for all products
    const productIds = (data || []).map((p) => p.id);
    const detailsMap = await this.batchGetProductDetails(productIds);

    // Attach details to each product
    const productsWithDetails = (data || []).map((product) => ({
      ...product,
      options: detailsMap[product.id]?.options || [],
      variants: detailsMap[product.id]?.variants || [],
    }));

    return {
      data: productsWithDetails,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find product by slug
   */
  async findProductBySlug(slug: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (productError || !productData) {
      if (productError?.code === 'PGRST116') {
        throw new NotFoundException(`Product with slug "${slug}" not found`);
      }
      throw new NotFoundException('Product not found');
    }

    // Fetch related data
    const [categoryData, imagesData, details] = await Promise.all([
      productData.category_id
        ? supabase
            .from('categories')
            .select('id, name, slug')
            .eq('id', productData.category_id)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productData.id)
        .order('display_order', { ascending: true }),
      this.getProductDetails(productData.id),
    ]);

    return {
      ...productData,
      category: categoryData.data,
      images: imagesData.data || [],
      options: details.options,
      variants: details.variants,
    };
  }

  /**
   * Find product by ID
   */
  async findProductById(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (productError || !productData) {
      if (productError?.code === 'PGRST116') {
        throw new NotFoundException(`Product with ID "${id}" not found`);
      }
      throw new NotFoundException('Product not found');
    }

    // Fetch related data (same as findProductBySlug)
    const [categoryData, imagesData, details] = await Promise.all([
      productData.category_id
        ? supabase
            .from('categories')
            .select('id, name, slug')
            .eq('id', productData.category_id)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productData.id)
        .order('display_order', { ascending: true }),
      this.getProductDetails(productData.id),
    ]);

    return {
      ...productData,
      category: categoryData.data,
      images: imagesData.data || [],
      options: details.options,
      variants: details.variants,
    };
  }

  /**
   * Find multiple products by IDs
   * Optimized with batch fetching
   */
  async findProductsByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const supabase = this.supabaseAdmin.getClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images:product_images(*)')
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      this.logger.error(`Failed to fetch products by IDs: ${error.message}`);
      throw new Error(error.message);
    }

    // Batch fetch details for all products
    const productIds = (products || []).map((p) => p.id);
    const detailsMap = await this.batchGetProductDetails(productIds);

    // Attach details to each product
    const productsWithDetails = (products || []).map((product) => ({
      ...product,
      options: detailsMap[product.id]?.options || [],
      variants: detailsMap[product.id]?.variants || [],
    }));

    return productsWithDetails;
  }

  /**
   * Get featured products with caching
   * Cache key: featured_products_{limit}
   * TTL: 5 minutes
   */
  async getFeaturedProducts(limit: number = 8) {
    const cacheKey = `featured_products_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images:product_images(*)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Failed to fetch featured products: ${error.message}`);
      throw new Error(error.message);
    }

    // Batch fetch details
    const productIds = (data || []).map((p) => p.id);
    const detailsMap = await this.batchGetProductDetails(productIds);

    const productsWithDetails = (data || []).map((product) => ({
      ...product,
      options: detailsMap[product.id]?.options || [],
      variants: detailsMap[product.id]?.variants || [],
    }));

    // Store in cache
    await this.cacheManager.set(cacheKey, productsWithDetails);
    this.logger.debug(`Cache set: ${cacheKey}`);

    return productsWithDetails;
  }

  /**
   * Get flash sale products (with discounts) with caching
   * Cache key: flash_sale_products_{limit}
   * TTL: 5 minutes
   */
  async getFlashSaleProducts(limit: number = 8) {
    const cacheKey = `flash_sale_products_${limit}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const supabase = this.supabaseAdmin.getClient();

    // Get products with original_price
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images:product_images(*)')
      .eq('is_active', true)
      .not('original_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Fetch more to filter

    if (error) {
      this.logger.error(`Failed to fetch flash sale products: ${error.message}`);
      throw new Error(error.message);
    }

    // Filter products with discount
    const flashSaleProducts = data.filter(
      (p) => p.original_price && p.original_price > p.price,
    );

    // Batch fetch details
    const productIds = flashSaleProducts.slice(0, limit).map((p) => p.id);
    const detailsMap = await this.batchGetProductDetails(productIds);

    const productsWithDetails = flashSaleProducts
      .slice(0, limit)
      .map((product) => ({
        ...product,
        options: detailsMap[product.id]?.options || [],
        variants: detailsMap[product.id]?.variants || [],
      }));

    // Store in cache
    await this.cacheManager.set(cacheKey, productsWithDetails);
    this.logger.debug(`Cache set: ${cacheKey}`);

    return productsWithDetails;
  }

  /**
   * Get all categories
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
   * Get category by slug
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
   */
  async getProductsByCategorySlug(
    slug: string,
    query: StorefrontProductQueryDto,
  ) {
    const supabase = this.supabaseAdmin.getClient();

    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      this.logger.warn(`Category not found: ${slug}`);
      throw new NotFoundException('Category not found');
    }

    return this.findAllProducts({
      ...query,
      category_id: category.id,
    });
  }

  /**
   * Get active shipping locations
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
