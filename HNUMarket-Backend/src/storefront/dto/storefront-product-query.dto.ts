import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Storefront Product Query DTO
 *
 * Validates query parameters for public product listing.
 * Supports pagination, search, filters, and sorting.
 *
 * Used in GET /api/storefront/products endpoints.
 */
export class StorefrontProductQueryDto {
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
  category_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'price' | 'created_at' | 'sold' = 'created_at';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}
