import { IsString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Product Option Value DTO
 * Represents a single value for an attribute (e.g., "Red", "Blue", "S", "M", "L")
 */
export class CreateProductOptionValueDto {
  /** Value for this option (e.g., "Red", "Blue", "S", "M", "L") */
  @IsString()
  value: string;
}

/**
 * Product Option DTO
 * Represents an attribute for a product (e.g., "Color", "Size", "Material")
 *
 * @example
 * {
 *   name: "Color",
 *   position: 0,
 *   values: [
 *     { value: "Red" },
 *     { value: "Blue" },
 *     { value: "Green" }
 *   ]
 * }
 */
export class CreateProductOptionDto {
  /** Attribute name (e.g., "Color", "Size", "Material") */
  @IsString()
  name: string;

  /** Display order position (0, 1, 2...) */
  @IsNumber()
  @Min(0)
  position: number;

  /** Array of possible values for this attribute */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionValueDto)
  values: CreateProductOptionValueDto[];
}
