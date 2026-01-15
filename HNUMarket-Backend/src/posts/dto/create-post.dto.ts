import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

/**
 * Post Status Enum
 */
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Create Post DTO
 *
 * Validates post creation data with title, content, cover image, and metadata.
 */
export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;
}
