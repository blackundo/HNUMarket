import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { StorefrontNormalizedService } from './storefront-normalized.service';
import { StorefrontProductQueryDto } from './dto/storefront-product-query.dto';
import { HomepageSectionsService } from '../homepage-sections/homepage-sections.service';

/**
 * Storefront Controller
 *
 * Public endpoints for storefront product browsing.
 * Uses StorefrontNormalizedService for multi-attribute variant support.
 * NO authentication required - open to public.
 *
 * @route /api/storefront
 */
@Controller('storefront')
export class StorefrontController {
  private readonly logger = new Logger(StorefrontController.name);

  constructor(
    private storefrontService: StorefrontNormalizedService,
    // Keep old service for backward compatibility
    private legacyStorefrontService: StorefrontService,
    private homepageSectionsService: HomepageSectionsService,
  ) {}

  /**
   * List all active products with pagination and filters
   *
   * @example GET /api/storefront/products?page=1&limit=20&search=iphone
   * @example GET /api/storefront/products?category_id=uuid&min_price=100000&max_price=500000
   */
  @Get('products')
  findAllProducts(@Query() query: StorefrontProductQueryDto) {
    this.logger.debug(`Fetching products: ${JSON.stringify(query)}`);
    return this.storefrontService.findAllProducts(query);
  }

  /**
   * Get featured products
   * IMPORTANT: This route must come BEFORE /products/:slug to avoid route conflicts
   *
   * @example GET /api/storefront/products/featured?limit=8
   */
  @Get('products/featured')
  getFeaturedProducts(@Query('limit') limit?: number) {
    const productLimit = limit ? Number(limit) : 8;
    this.logger.debug(`Fetching featured products: limit=${productLimit}`);
    return this.storefrontService.getFeaturedProducts(productLimit);
  }

  /**
   * Get flash sale products
   * IMPORTANT: This route must come BEFORE /products/:slug to avoid route conflicts
   *
   * @example GET /api/storefront/products/flash-sale?limit=8
   */
  @Get('products/flash-sale')
  getFlashSaleProducts(@Query('limit') limit?: number) {
    const productLimit = limit ? Number(limit) : 8;
    this.logger.debug(`Fetching flash sale products: limit=${productLimit}`);
    return this.storefrontService.getFlashSaleProducts(productLimit);
  }

  /**
   * Get single product by ID
   * IMPORTANT: This route must come BEFORE /products/:slug to avoid conflicts
   *
   * @example GET /api/storefront/products/by-id/uuid
   */
  @Get('products/by-id/:id')
  findProductById(@Param('id') id: string) {
    this.logger.debug(`Fetching product by ID: ${id}`);
    return this.storefrontService.findProductById(id);
  }

  /**
   * Get multiple products by IDs
   * Useful for cart items
   *
   * @example POST /api/storefront/products/by-ids
   * @body { ids: ['uuid1', 'uuid2'] }
   */
  @Post('products/by-ids')
  findProductsByIds(@Body('ids') ids: string[]) {
    this.logger.debug(`Fetching products by IDs: ${ids?.length || 0} items`);
    return this.storefrontService.findProductsByIds(ids);
  }

  /**
   * Get single product by slug
   * IMPORTANT: This route must come AFTER specific routes like /featured, /flash-sale, /by-id
   *
   * @example GET /api/storefront/products/iphone-15-pro-max
   */
  @Get('products/:slug')
  findProductBySlug(@Param('slug') slug: string) {
    this.logger.debug(`Fetching product by slug: ${slug}`);
    return this.storefrontService.findProductBySlug(slug);
  }

  /**
   * Get all categories
   *
   * @example GET /api/storefront/categories
   */
  @Get('categories')
  getAllCategories() {
    this.logger.debug('Fetching all categories');
    return this.storefrontService.getAllCategories();
  }

  /**
   * Get products by category slug
   * IMPORTANT: This route must come BEFORE /categories/:slug to avoid route conflicts
   *
   * @example GET /api/storefront/categories/dien-thoai/products?page=1&limit=20
   */
  @Get('categories/:slug/products')
  getProductsByCategorySlug(
    @Param('slug') slug: string,
    @Query() query: StorefrontProductQueryDto,
  ) {
    this.logger.debug(`Fetching products for category: ${slug}`);
    return this.storefrontService.getProductsByCategorySlug(slug, query);
  }

  /**
   * Get single category by slug
   * IMPORTANT: This route must come AFTER /categories/:slug/products to avoid conflicts
   *
   * @example GET /api/storefront/categories/banh-sua
   */
  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    this.logger.debug(`Fetching category by slug: ${slug}`);
    return this.storefrontService.getCategoryBySlug(slug);
  }

  /**
   * Get active shipping locations
   * Public endpoint for cart page
   *
   * @example GET /api/storefront/shipping-locations
   */
  @Get('shipping-locations')
  getShippingLocations() {
    this.logger.debug('Fetching shipping locations');
    return this.storefrontService.getShippingLocations();
  }

  /**
   * Get active homepage sections with resolved products
   * Public endpoint for homepage
   * Returns sections with manually selected + auto-filled products
   *
   * @example GET /api/storefront/homepage-sections
   */
  @Get('homepage-sections')
  getHomepageSections() {
    this.logger.debug('Fetching homepage sections');
    return this.homepageSectionsService.getActiveWithProducts();
  }
}
