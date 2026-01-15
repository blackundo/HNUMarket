import { IsOptional, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Hero Slide Query DTO
 *
 * Validates query parameters for listing hero slides.
 */
export class HeroSlideQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string = 'display_order';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
