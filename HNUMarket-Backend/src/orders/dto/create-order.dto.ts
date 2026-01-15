import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating an order item
 */
export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

/**
 * DTO for shipping/billing address
 */
export class AddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

/**
 * DTO for creating a new order
 */
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  billingAddress?: AddressDto;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  @Min(0)
  shippingFee: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
