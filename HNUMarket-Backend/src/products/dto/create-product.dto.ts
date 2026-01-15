import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  ValidateNested,
  Matches,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductUnit } from '../../common/enums/product-unit.enum';

/**
 * Product variant DTO with unit system for grocery items
 *
 * @example
 * {
 *   name: "Lốc 6",
 *   displayName: "Lốc 6 gói",
 *   unit: ProductUnit.LOC,
 *   conversionRate: 6,
 *   stock: 20,
 *   price: 28000
 * }
 */
class CreateVariantDto {
  /** Variant name (e.g., "Gói 1", "Lốc 6", "Thùng 24") */
  @IsString()
  name: string;

  /** Display name for UI (e.g., "1 Gói", "Lốc 6 gói") */
  @IsString()
  @IsOptional()
  displayName?: string;

  /** Legacy field for backward compatibility */
  @IsString()
  @IsOptional()
  type?: string;

  /** Legacy field for backward compatibility */
  @IsString()
  @IsOptional()
  value?: string;

  /** Vietnamese unit type */
  @IsEnum(ProductUnit, {
    message: 'Unit must be a valid ProductUnit value (goi, loc, thung, etc.)',
  })
  unit: ProductUnit;

  /** Conversion rate to base unit (goi=1, loc 6=6, thung 24=24) */
  @IsNumber()
  @Min(1, { message: 'Conversion rate must be at least 1' })
  conversionRate: number;

  /** Stock quantity for this variant */
  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;

  /** Absolute price in KRW for this variant */
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  /** @deprecated Use price instead. Kept for backward compatibility */
  @IsNumber()
  @IsOptional()
  priceAdjustment?: number;
}

/**
 * Product Option Value DTO
 */
class ProductOptionValueDto {
  @IsString()
  value: string;
}

/**
 * Product Option DTO
 */
class ProductOptionDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  position: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueDto)
  values: ProductOptionValueDto[];
}

/**
 * Product Variant DTO (Normalized)
 */
class ProductVariantDto {
  @IsObject()
  attributeCombination: Record<string, string>;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Create Product DTO (Supports both old and new variant structures)
 *
 * Validates product data for creation with comprehensive validation rules.
 * Used in POST /api/admin/products endpoint.
 */
export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsOptional()
  specifications?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  /** Legacy variants (old schema) - for backward compatibility */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  /** New normalized variants */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variantsNormalized?: ProductVariantDto[];

  /** Product options/attributes */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  @IsOptional()
  options?: ProductOptionDto[];
}
