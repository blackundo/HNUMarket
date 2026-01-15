import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * Update Product DTO
 *
 * Makes all CreateProductDto fields optional for PATCH operations.
 * Used in PATCH /api/admin/products/:id endpoint.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
