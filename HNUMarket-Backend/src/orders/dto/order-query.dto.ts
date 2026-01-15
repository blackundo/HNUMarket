import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from './update-order-status.dto';

/**
 * DTO for querying orders with pagination and filters
 */
export class OrderQueryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'created_at';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
