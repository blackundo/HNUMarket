import { Module } from '@nestjs/common';
import { HomepageSectionsController } from './homepage-sections.controller';
import { HomepageSectionsService } from './homepage-sections.service';

/**
 * Homepage Sections Module
 *
 * Provides admin-controlled homepage customization with flexible
 * category sections, manual product selection, auto-fill logic,
 * and customizable layouts (slider/grid/carousel).
 *
 * Features:
 * - CRUD operations for homepage sections
 * - Drag-drop reordering
 * - Hybrid product selection (manual + auto-fill)
 * - Multiple layout options (1-2 rows, banner support)
 * - Public storefront endpoint
 *
 * Note: SupabaseModule is @Global(), so it's automatically available
 */
@Module({
  controllers: [HomepageSectionsController],
  providers: [HomepageSectionsService],
  exports: [HomepageSectionsService],
})
export class HomepageSectionsModule {}
