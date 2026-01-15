import { Controller, Get, Logger } from '@nestjs/common';
import { HeroSlidesService } from './hero-slides.service';

/**
 * Hero Slides Public Controller
 *
 * Public endpoint for storefront hero slider.
 * NO authentication required - open to public.
 *
 * @route /api/hero-slides
 */
@Controller('hero-slides')
export class HeroSlidesPublicController {
  private readonly logger = new Logger(HeroSlidesPublicController.name);

  constructor(private heroSlidesService: HeroSlidesService) {}

  /**
   * Get active hero slides for storefront
   *
   * @example GET /api/hero-slides
   */
  @Get()
  getActiveSlides() {
    this.logger.debug('Fetching active hero slides for storefront');
    return this.heroSlidesService.getActiveSlides();
  }
}
