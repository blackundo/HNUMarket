import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

/**
 * Categories Module
 *
 * Provides category management functionality with CRUD operations.
 * Exports CategoriesService for use in other modules.
 */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

