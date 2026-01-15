import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Category Query DTO
 *
 * Validates query parameters for category listing with pagination,
 * search, filters, and sorting options.
 */
export class CategoryQueryDto {
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
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  isActive?: string; // Accept as string, convert in service

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'display_order' | 'created_at' = 'display_order';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

