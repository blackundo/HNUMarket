import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesPublicController } from './pages-public.controller';
import { PagesService } from './pages.service';

/**
 * Pages Module
 *
 * Provides static pages management and public storefront access.
 */
@Module({
  controllers: [PagesController, PagesPublicController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
