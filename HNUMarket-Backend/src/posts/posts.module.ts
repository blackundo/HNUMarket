import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

/**
 * Posts Module
 *
 * Provides blog posts management functionality with CRUD operations.
 * Exports PostsService for use in other modules.
 */
@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
