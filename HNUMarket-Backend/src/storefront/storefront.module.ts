import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { StorefrontNormalizedService } from './storefront-normalized.service';
import { StorefrontPostsService } from './storefront-posts.service';
import { HomepageSectionsModule } from '../homepage-sections/homepage-sections.module';

/**
 * Storefront Module
 *
 * Public-facing module for product browsing and category listing.
 * Uses StorefrontNormalizedService for multi-attribute variant support.
 * All endpoints are public - no authentication required.
 *
 * Cache Configuration:
 * - TTL: 300 seconds (5 minutes) for featured/flash-sale products
 * - In-memory cache to reduce database queries
 */
@Module({
  imports: [
    HomepageSectionsModule,
    CacheModule.register({
      ttl: 300, // 5 minutes cache
      max: 100, // Maximum 100 items in cache
    }),
  ],
  controllers: [StorefrontController],
  providers: [
    StorefrontNormalizedService,
    // Keep old service for backward compatibility
    StorefrontService,
    StorefrontPostsService,
  ],
  exports: [StorefrontNormalizedService, StorefrontService, StorefrontPostsService],
})
export class StorefrontModule { }