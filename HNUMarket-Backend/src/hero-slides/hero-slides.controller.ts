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
import { HeroSlidesService } from './hero-slides.service';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';
import { HeroSlideQueryDto } from './dto/hero-slide-query.dto';
import { ReorderHeroSlidesDto } from './dto/reorder-hero-slides.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Hero Slides Controller
 *
 * Admin-only endpoints for hero slide management.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/hero-slides
 */
@Controller('admin/hero-slides')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HeroSlidesController {
  private readonly logger = new Logger(HeroSlidesController.name);

  constructor(private heroSlidesService: HeroSlidesService) {}

  /**
   * List hero slides with pagination and filters
   *
   * @example GET /api/admin/hero-slides?page=1&limit=20&search=summer
   */
  @Get()
  findAll(@Query() query: HeroSlideQueryDto) {
    this.logger.debug(`Fetching hero slides with query: ${JSON.stringify(query)}`);
    return this.heroSlidesService.findAll(query);
  }

  /**
   * Get single hero slide by ID
   *
   * @example GET /api/admin/hero-slides/550e8400-e29b-41d4-a716-446655440000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching hero slide: ${id}`);
    return this.heroSlidesService.findOne(id);
  }

  /**
   * Create new hero slide
   *
   * @example POST /api/admin/hero-slides
   */
  @Post()
  create(@Body() dto: CreateHeroSlideDto) {
    this.logger.log(`Creating hero slide: ${dto.title}`);
    return this.heroSlidesService.create(dto);
  }

  /**
   * Reorder hero slides
   *
   * @example POST /api/admin/hero-slides/reorder
   */
  @Post('reorder')
  reorder(@Body() dto: ReorderHeroSlidesDto) {
    this.logger.log(`Reordering hero slides: ${dto.ids.length} slides`);
    return this.heroSlidesService.reorder(dto);
  }

  /**
   * Update existing hero slide
   *
   * @example PATCH /api/admin/hero-slides/550e8400-e29b-41d4-a716-446655440000
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHeroSlideDto) {
    this.logger.log(`Updating hero slide: ${id}`);
    return this.heroSlidesService.update(id, dto);
  }

  /**
   * Delete hero slide
   *
   * @example DELETE /api/admin/hero-slides/550e8400-e29b-41d4-a716-446655440000
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting hero slide: ${id}`);
    return this.heroSlidesService.remove(id);
  }
}
