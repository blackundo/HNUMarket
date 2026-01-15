import { IsNumber, Min } from 'class-validator';

/**
 * DTO for updating order item quantity
 * Admin only - used to modify pending/confirmed orders
 */
export class UpdateOrderItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
