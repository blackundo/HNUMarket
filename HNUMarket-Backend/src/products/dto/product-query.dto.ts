import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Product Query DTO
 *
 * Validates query parameters for product listing with pagination,
 * search, filters, and sorting options.
 *
 * Used in GET /api/admin/products endpoint.
 */
export class ProductQueryDto {
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
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  isActive?: string; // Accept as string, convert in service

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @IsOptional()
  @IsString()
  isFeatured?: string; // Accept as string, convert in service

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'price' | 'createdAt' | 'sold' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
