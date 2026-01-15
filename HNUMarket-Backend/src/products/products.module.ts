import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsNormalizedService } from './products-normalized.service';

/**
 * Products Module
 *
 * Provides product management functionality with CRUD operations.
 * Uses ProductsNormalizedService for multi-attribute variant support.
 */
@Module({
  controllers: [ProductsController],
  providers: [
    ProductsNormalizedService,
    // Keep old service for backward compatibility
    ProductsService,
    // Make normalized service the default
    {
      provide: 'PRODUCTS_SERVICE',
      useClass: ProductsNormalizedService,
    },
  ],
  exports: [ProductsNormalizedService, ProductsService],
})
export class ProductsModule {}
