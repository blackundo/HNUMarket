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
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Pages Controller
 *
 * Admin-only endpoints for static pages management.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/pages
 */
@Controller('admin/pages')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PagesController {
  private readonly logger = new Logger(PagesController.name);

  constructor(private pagesService: PagesService) {}

  /**
   * List all pages with pagination and filtering
   *
   * @example GET /api/admin/pages?page=1&limit=20&status=published
   */
  @Get()
  findAll(@Query() query: PageQueryDto) {
    this.logger.log(`Listing pages: page=${query.page}, limit=${query.limit}`);
    return this.pagesService.findAll(query);
  }

  /**
   * Get single page by ID
   *
   * @example GET /api/admin/pages/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Fetching page: ${id}`);
    return this.pagesService.findOne(id);
  }

  /**
   * Create new page
   *
   * @example POST /api/admin/pages
   */
  @Post()
  create(@Body() dto: CreatePageDto) {
    this.logger.log(`Creating page: ${dto.title}`);
    return this.pagesService.create(dto);
  }

  /**
   * Update existing page
   *
   * @example PATCH /api/admin/pages/123e4567-e89b-12d3-a456-426614174000
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    this.logger.log(`Updating page: ${id}`);
    return this.pagesService.update(id, dto);
  }

  /**
   * Delete page (soft delete via archiving)
   *
   * @example DELETE /api/admin/pages/123e4567-e89b-12d3-a456-426614174000
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`Archiving page: ${id}`);
    return this.pagesService.remove(id);
  }

  /**
   * Publish page
   *
   * @example POST /api/admin/pages/123e4567-e89b-12d3-a456-426614174000/publish
   */
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    this.logger.log(`Publishing page: ${id}`);
    return this.pagesService.publish(id);
  }

  /**
   * Unpublish page (set to draft)
   *
   * @example POST /api/admin/pages/123e4567-e89b-12d3-a456-426614174000/unpublish
   */
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    this.logger.log(`Unpublishing page: ${id}`);
    return this.pagesService.unpublish(id);
  }
}
