import { PartialType } from '@nestjs/mapped-types';
import { CreateProductNormalizedDto } from './create-product-normalized.dto';

/**
 * Update Product DTO (Normalized Multi-Attribute Schema)
 *
 * All fields are optional for partial updates
 */
export class UpdateProductNormalizedDto extends PartialType(
  CreateProductNormalizedDto,
) {}
