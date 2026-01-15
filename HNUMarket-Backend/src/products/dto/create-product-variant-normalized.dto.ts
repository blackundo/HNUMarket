import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsObject,
} from 'class-validator';

/**
 * Product Variant DTO for Normalized Schema
 * Represents a SKU with specific attribute combinations
 *
 * @example Single-attribute variant (Size only):
 * {
 *   attributeCombination: { "Size": "M" },
 *   stock: 50,
 *   price: 25000,
 *   sku: "SHIRT-M"
 * }
 *
 * @example Multi-attribute variant (Color + Size) with discount:
 * {
 *   attributeCombination: { "Color": "Blue", "Size": "XL" },
 *   stock: 30,
 *   price: 28000,
 *   originalPrice: 35000,
 *   sku: "SHIRT-BLUE-XL",
 *   imageUrl: "https://..."
 * }
 */
export class CreateProductVariantNormalizedDto {
  /**
   * Attribute combination for this variant
   * Key = attribute name, Value = attribute value
   * @example { "Color": "Blue", "Size": "XL" }
   */
  @IsObject()
  attributeCombination: Record<string, string>;

  /** Stock quantity for this variant */
  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;

  /** Absolute price in KRW for this variant */
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  /** Original price for discount display */
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Original price cannot be negative' })
  originalPrice?: number;

  /** Optional SKU/barcode for warehouse management */
  @IsString()
  @IsOptional()
  sku?: string;

  /** Optional variant-specific image URL */
  @IsString()
  @IsOptional()
  imageUrl?: string;

  /** Whether this variant is active/available */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
