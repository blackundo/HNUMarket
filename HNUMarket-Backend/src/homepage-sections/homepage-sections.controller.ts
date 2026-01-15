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
import { HomepageSectionsService } from './homepage-sections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Homepage Sections Controller
 *
 * Admin-only endpoints for homepage customization.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/homepage-sections
 */
@Controller('admin/homepage-sections')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HomepageSectionsController {
  private readonly logger = new Logger(HomepageSectionsController.name);

  constructor(private homepageSectionsService: HomepageSectionsService) {}

  /**
   * List all homepage sections with pagination and filters
   *
   * @example GET /api/admin/homepage-sections?page=1&limit=20
   */
  @Get()
  findAll(@Query() query: any) {
    this.logger.debug(`Fetching homepage sections with query: ${JSON.stringify(query)}`);
    return this.homepageSectionsService.findAll(query);
  }

  /**
   * Get single homepage section by ID
   *
   * @example GET /api/admin/homepage-sections/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching homepage section: ${id}`);
    return this.homepageSectionsService.findOne(id);
  }

  /**
   * Create new homepage section
   *
   * @example POST /api/admin/homepage-sections
   */
  @Post()
  create(@Body() dto: any) {
    this.logger.log(`Creating homepage section for category: ${dto.categoryId}`);
    return this.homepageSectionsService.create(dto);
  }

  /**
   * Reorder homepage sections by drag-drop
   *
   * @example POST /api/admin/homepage-sections/reorder
   * @body { ids: ['uuid1', 'uuid2', 'uuid3'] }
   */
  @Post('reorder')
  reorder(@Body() dto: any) {
    this.logger.log(`Reordering homepage sections: ${dto.ids.length} sections`);
    return this.homepageSectionsService.reorder(dto);
  }

  /**
   * Preview products for a section (manual + auto-fill resolved)
   *
   * @example GET /api/admin/homepage-sections/:id/preview-products
   */
  @Get(':id/preview-products')
  previewProducts(@Param('id') id: string) {
    this.logger.debug(`Previewing products for section: ${id}`);
    return this.homepageSectionsService.previewProducts(id);
  }

  /**
   * Update existing homepage section
   *
   * @example PATCH /api/admin/homepage-sections/550e8400-e29b-41d4-a716-446655440000
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    this.logger.log(`Updating homepage section: ${id}`);
    return this.homepageSectionsService.update(id, dto);
  }

  /**
   * Delete homepage section
   *
   * @example DELETE /api/admin/homepage-sections/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting homepage section: ${id}`);
    return this.homepageSectionsService.remove(id);
  }
}
