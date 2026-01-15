import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO for adding a product to an existing order
 * Admin only - used to modify pending/confirmed orders
 */
export class AddOrderItemDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  // Note: unitPrice is NOT included in DTO
  // Price is always fetched from current product/variant data (no manual override)
}
