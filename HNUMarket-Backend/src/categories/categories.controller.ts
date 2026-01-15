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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Categories Controller
 *
 * Admin-only endpoints for category management.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/categories
 */
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private categoriesService: CategoriesService) {}

  /**
   * List categories with pagination and filters
   *
   * @example GET /api/admin/categories?page=1&limit=10&search=phone
   */
  @Get()
  findAll(@Query() query: CategoryQueryDto) {
    this.logger.debug(`Fetching categories with query: ${JSON.stringify(query)}`);
    return this.categoriesService.findAll(query);
  }

  /**
   * Get single category by ID
   *
   * @example GET /api/admin/categories/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching category: ${id}`);
    return this.categoriesService.findOne(id);
  }

  /**
   * Create new category
   *
   * @example POST /api/admin/categories
   */
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    this.logger.log(`Creating category: ${dto.name}`);
    return this.categoriesService.create(dto);
  }

  /**
   * Update existing category
   *
   * @example PATCH /api/admin/categories/550e8400-e29b-41d4-a716-446655440000
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    this.logger.log(`Updating category: ${id}`);
    return this.categoriesService.update(id, dto);
  }

  /**
   * Delete category
   *
   * @example DELETE /api/admin/categories/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting category: ${id}`);
    return this.categoriesService.remove(id);
  }

  /**
   * Reorder categories
   *
   * @example POST /api/admin/categories/reorder
   * @body { ids: ['uuid1', 'uuid2', 'uuid3'] }
   */
  @Post('reorder')
  reorder(@Body() dto: ReorderCategoriesDto) {
    this.logger.log(`Reordering categories: ${dto.ids.length} categories`);
    return this.categoriesService.reorder(dto);
  }
}

