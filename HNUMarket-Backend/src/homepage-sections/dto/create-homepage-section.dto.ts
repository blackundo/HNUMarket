import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  IsObject,
  IsEnum,
  IsIn,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Layout Configuration DTO
 */
class LayoutConfigDto {
  @IsNumber()
  @IsIn([1, 2])
  row_count: 1 | 2;

  @IsString()
  @IsIn(['slider', 'grid', 'carousel'])
  display_style: 'slider' | 'grid' | 'carousel';

  @IsNumber()
  @Min(4)
  @Max(24)
  product_limit: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(6)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(10000)
  autoplay_delay?: number; // Carousel autoplay delay in ms (default: 3000)
}

/**
 * Auto-fill Configuration DTO
 */
class AutoFillConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsIn(['newest', 'best_selling', 'featured', 'random'])
  criteria: 'newest' | 'best_selling' | 'featured' | 'random';

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock?: number;

  @IsOptional()
  @IsBoolean()
  exclude_out_of_stock?: boolean;
}

/**
 * Products Configuration DTO
 */
class ProductsConfigDto {
  @IsArray()
  @IsUUID('4', { each: true })
  selected_product_ids: string[];

  @ValidateNested()
  @Type(() => AutoFillConfigDto)
  auto_fill: AutoFillConfigDto;
}

/**
 * Banner Configuration DTO
 */
class BannerConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  link_url?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsString()
  @IsIn(['left', 'right'])
  position?: 'left' | 'right';

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50)
  width_ratio?: number;
}

/**
 * Display Configuration DTO
 */
class DisplayConfigDto {
  @IsBoolean()
  show_category_header: boolean;

  @IsOptional()
  @IsString()
  custom_title?: string;

  @IsBoolean()
  show_view_all_link: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['fade', 'slide', 'none'])
  animation?: 'fade' | 'slide' | 'none';
}

/**
 * Homepage Section Configuration DTO
 */
export class HomepageSectionConfigDto {
  @ValidateNested()
  @Type(() => LayoutConfigDto)
  layout: LayoutConfigDto;

  @ValidateNested()
  @Type(() => ProductsConfigDto)
  products: ProductsConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BannerConfigDto)
  banner?: BannerConfigDto;

  @ValidateNested()
  @Type(() => DisplayConfigDto)
  display: DisplayConfigDto;
}

/**
 * Create Homepage Section DTO
 *
 * Validates request body for creating a new homepage section.
 * Includes nested config for layout, products, banner, and display settings.
 *
 * @example
 * ```json
 * {
 *   "categoryId": "550e8400-e29b-41d4-a716-446655440000",
 *   "displayOrder": 0,
 *   "isActive": true,
 *   "config": {
 *     "layout": {
 *       "row_count": 1,
 *       "display_style": "slider",
 *       "product_limit": 8
 *     },
 *     "products": {
 *       "selected_product_ids": [],
 *       "auto_fill": {
 *         "enabled": true,
 *         "criteria": "newest"
 *       }
 *     },
 *     "display": {
 *       "show_category_header": true,
 *       "show_view_all_link": true
 *     }
 *   }
 * }
 * ```
 */
export class CreateHomepageSectionDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => HomepageSectionConfigDto)
  config: HomepageSectionConfigDto;
}
