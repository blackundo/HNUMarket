import { IsString, IsOptional, IsEnum } from 'class-validator';

/**
 * Page Status Enum
 */
export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Create Page DTO
 *
 * Validates page creation data for static pages.
 */
export class CreatePageDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  // HTML content string
  content?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsEnum(PageStatus)
  @IsOptional()
  status?: PageStatus;
}
