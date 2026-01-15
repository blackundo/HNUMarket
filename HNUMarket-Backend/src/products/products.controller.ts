import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { ProductsNormalizedService } from './products-normalized.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { TrashQueryDto, BulkTrashDto } from './dto/trash-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Products Controller
 *
 * Admin-only endpoints for product management.
 * All routes require JWT authentication + admin role.
 * Uses ProductsNormalizedService for multi-attribute variant support.
 *
 * @route /api/admin/products
 */
@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private productsService: ProductsNormalizedService,
    // Keep old service for backward compatibility if needed
    private legacyProductsService: ProductsService,
  ) {}

  /**
   * List products with pagination and filters
   *
   * @example GET /api/admin/products?page=1&limit=20&search=iphone
   */
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    this.logger.debug(`Fetching products with query: ${JSON.stringify(query)}`);
    return this.productsService.findAll(query);
  }

  /**
   * Check if slug is available
   *
   * @example GET /api/admin/products/check-slug/test-slug?excludeId=550e8400-e29b-41d4-a716-446655440000
   */
  @Get('check-slug/:slug')
  checkSlug(@Param('slug') slug: string, @Query('excludeId') excludeId?: string) {
    this.logger.debug(`Checking slug availability: ${slug}`);
    return this.productsService.checkSlugAvailability(slug, excludeId);
  }

  /**
   * List products in trash
   *
   * @example GET /api/admin/products/trash?page=1&limit=20
   */
  @Get('trash')
  findTrash(@Query() query: TrashQueryDto) {
    this.logger.debug('Fetching trash products');
    return this.productsService.findTrash(query);
  }

  /**
   * Get single product by ID
   *
   * @example GET /api/admin/products/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching product: ${id}`);
    return this.productsService.findOne(id);
  }

  /**
   * Create new product
   *
   * @example POST /api/admin/products
   */
  @Post()
  create(@Body() dto: CreateProductDto) {
    this.logger.log(`Creating product: ${dto.name}`);
    return this.productsService.create(dto);
  }

  /**
   * Bulk move products to trash
   *
   * @example POST /api/admin/products/bulk/trash
   */
  @Post('bulk/trash')
  bulkMoveToTrash(@Body() dto: BulkTrashDto, @Req() req: Request) {
    this.logger.log(`Bulk moving ${dto.ids.length} products to trash`);
    const userId = (req as { user?: { id?: string } }).user?.id;
    return this.productsService.bulkMoveToTrash(dto.ids, userId);
  }

  /**
   * Bulk restore products from trash
   *
   * @example POST /api/admin/products/bulk/restore
   */
  @Post('bulk/restore')
  bulkRestore(@Body() dto: BulkTrashDto) {
    this.logger.log(`Bulk restoring ${dto.ids.length} products from trash`);
    return this.productsService.bulkRestore(dto.ids);
  }

  /**
   * Restore product from trash
   *
   * @example POST /api/admin/products/:id/restore
   */
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    this.logger.log(`Restoring product: ${id}`);
    return this.productsService.restore(id);
  }

  /**
   * Update existing product
   *
   * @example PATCH /api/admin/products/550e8400-e29b-41d4-a716-446655440000
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    this.logger.log(`Updating product: ${id}`);
    return this.productsService.update(id, dto);
  }

  /**
   * Empty entire trash
   *
   * @example DELETE /api/admin/products/trash
   */
  @Delete('trash')
  emptyTrash() {
    this.logger.log('Emptying trash');
    return this.productsService.emptyTrash();
  }

  /**
   * Permanently delete product from trash
   *
   * @example DELETE /api/admin/products/trash/:id
   */
  @Delete('trash/:id')
  permanentDelete(@Param('id') id: string) {
    this.logger.log(`Permanently deleting product: ${id}`);
    return this.productsService.permanentDelete(id);
  }

  /**
   * Move product to trash (replaces old soft delete)
   *
   * @example DELETE /api/admin/products/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Moving product to trash: ${id}`);
    const userId = (req as { user?: { id?: string } }).user?.id;
    return this.productsService.moveToTrash(id, userId);
  }
}
