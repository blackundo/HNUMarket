import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Homepage Section Query DTO
 *
 * Query parameters for listing homepage sections with pagination and filters.
 *
 * @example
 * ```
 * GET /api/admin/homepage-sections?page=1&limit=20&isActive=true
 * ```
 */
export class HomepageSectionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  /**
   * Filter by active status
   * Accept as string to avoid NestJS boolean parsing issues
   * "true" | "false" | undefined
   */
  @IsOptional()
  @IsString()
  isActive?: string;
}
