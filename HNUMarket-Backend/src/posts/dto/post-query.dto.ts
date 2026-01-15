import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from './create-post.dto';

/**
 * Post Query DTO
 *
 * Validates query parameters for filtering and paginating posts.
 */
export class PostQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'createdAt' | 'publishedAt' | 'viewCount' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
