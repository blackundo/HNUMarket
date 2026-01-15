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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

/**
 * Posts Controller
 *
 * Admin-only endpoints for blog posts management.
 * All routes require JWT authentication + admin role.
 *
 * @route /api/admin/posts
 */
@Controller('admin/posts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private postsService: PostsService) {}

  /**
   * List all posts with pagination and filtering
   *
   * @example
   * GET /api/admin/posts?page=1&limit=20&status=published
   */
  @Get()
  findAll(@Query() query: PostQueryDto) {
    this.logger.log(`Listing posts: page=${query.page}, limit=${query.limit}`);
    return this.postsService.findAll(query);
  }

  /**
   * Get single post by ID
   *
   * @example
   * GET /api/admin/posts/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Fetching post: ${id}`);
    return this.postsService.findOne(id);
  }

  /**
   * Create new post
   *
   * @example
   * POST /api/admin/posts
   * Body: { title: "My Post", content: "<p>Content</p>", status: "draft" }
   */
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    this.logger.log(`Creating post: ${dto.title} by user ${user.id}`);
    return this.postsService.create(dto, user.id);
  }

  /**
   * Update existing post
   *
   * @example
   * PATCH /api/admin/posts/123e4567-e89b-12d3-a456-426614174000
   * Body: { title: "Updated Title" }
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    this.logger.log(`Updating post: ${id}`);
    return this.postsService.update(id, dto);
  }

  /**
   * Delete post (soft delete via archiving)
   *
   * @example
   * DELETE /api/admin/posts/123e4567-e89b-12d3-a456-426614174000
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`Archiving post: ${id}`);
    return this.postsService.remove(id);
  }

  /**
   * Publish post
   *
   * @example
   * POST /api/admin/posts/123e4567-e89b-12d3-a456-426614174000/publish
   */
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    this.logger.log(`Publishing post: ${id}`);
    return this.postsService.publish(id);
  }

  /**
   * Unpublish post (set to draft)
   *
   * @example
   * POST /api/admin/posts/123e4567-e89b-12d3-a456-426614174000/unpublish
   */
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    this.logger.log(`Unpublishing post: ${id}`);
    return this.postsService.unpublish(id);
  }
}
