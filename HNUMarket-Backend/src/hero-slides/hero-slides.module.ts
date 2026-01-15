import { Module } from '@nestjs/common';
import { HeroSlidesController } from './hero-slides.controller';
import { HeroSlidesPublicController } from './hero-slides-public.controller';
import { HeroSlidesService } from './hero-slides.service';

/**
 * Hero Slides Module
 *
 * Provides hero slide management functionality with CRUD operations.
 * Includes both admin and public endpoints.
 * Exports HeroSlidesService for use in other modules.
 */
@Module({
  controllers: [HeroSlidesController, HeroSlidesPublicController],
  providers: [HeroSlidesService],
  exports: [HeroSlidesService],
})
export class HeroSlidesModule {}
