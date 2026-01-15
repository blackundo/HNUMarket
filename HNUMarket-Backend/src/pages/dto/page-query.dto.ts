import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PageStatus } from './create-page.dto';

/**
 * Page Query DTO
 *
 * Validates query parameters for filtering and paginating pages.
 */
export class PageQueryDto {
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
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'createdAt' | 'publishedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
