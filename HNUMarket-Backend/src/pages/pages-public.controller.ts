import { Controller, Get, Param, Logger } from '@nestjs/common';
import { PagesService } from './pages.service';

/**
 * Pages Public Controller
 *
 * Public endpoints for storefront static pages.
 *
 * @route /api/storefront/pages
 */
@Controller('storefront/pages')
export class PagesPublicController {
  private readonly logger = new Logger(PagesPublicController.name);

  constructor(private pagesService: PagesService) {}

  /**
   * List all published pages
   *
   * @example GET /api/storefront/pages
   */
  @Get()
  findAllPublished() {
    this.logger.debug('Fetching published pages');
    return this.pagesService.findPublishedPages();
  }

  /**
   * Get published page by slug
   *
   * @example GET /api/storefront/pages/about-us
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    this.logger.debug(`Fetching published page by slug: ${slug}`);
    return this.pagesService.findPublishedBySlug(slug);
  }
}
