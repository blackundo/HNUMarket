import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductOptionDto } from './create-product-option.dto';
import { CreateProductVariantNormalizedDto } from './create-product-variant-normalized.dto';

/**
 * Create Product DTO (Normalized Multi-Attribute Schema)
 *
 * Supports flexible multi-attribute variants (Color, Size, Material, etc.)
 *
 * @example Single-attribute product (Size only):
 * {
 *   name: "T-Shirt",
 *   slug: "t-shirt",
 *   description: "Cotton t-shirt",
 *   price: 20000,
 *   categoryId: "uuid",
 *   imageUrls: ["https://..."],
 *   options: [
 *     {
 *       name: "Size",
 *       position: 0,
 *       values: [
 *         { value: "S" },
 *         { value: "M" },
 *         { value: "L" }
 *       ]
 *     }
 *   ],
 *   variants: [
 *     { attributeCombination: { "Size": "S" }, stock: 10, price: 20000 },
 *     { attributeCombination: { "Size": "M" }, stock: 15, price: 20000 },
 *     { attributeCombination: { "Size": "L" }, stock: 20, price: 22000 }
 *   ]
 * }
 *
 * @example Multi-attribute product (Color + Size):
 * {
 *   name: "Premium Shirt",
 *   price: 25000,
 *   options: [
 *     {
 *       name: "Color",
 *       position: 0,
 *       values: [{ value: "Blue" }, { value: "Red" }]
 *     },
 *     {
 *       name: "Size",
 *       position: 1,
 *       values: [{ value: "M" }, { value: "L" }]
 *     }
 *   ],
 *   variants: [
 *     { attributeCombination: { "Color": "Blue", "Size": "M" }, stock: 10, price: 25000 },
 *     { attributeCombination: { "Color": "Blue", "Size": "L" }, stock: 8, price: 25000 },
 *     { attributeCombination: { "Color": "Red", "Size": "M" }, stock: 12, price: 27000 },
 *     { attributeCombination: { "Color": "Red", "Size": "L" }, stock: 6, price: 27000 }
 *   ]
 * }
 */
export class CreateProductNormalizedDto {
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

  /** Base/minimum price for the product */
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

  /** Stock will be auto-calculated from variant stocks */
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

  /** Product attributes/options (Color, Size, Material, etc.) */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  @IsOptional()
  options?: CreateProductOptionDto[];

  /** Product variants (SKUs with attribute combinations) */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantNormalizedDto)
  @IsOptional()
  variants?: CreateProductVariantNormalizedDto[];
}
