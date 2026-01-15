/**
 * Order Types for HNUMarket Frontend
 * Matches backend OrdersModule schema with normalized variants
 */

import { Product } from './index';
import { ProductVariantNormalized } from './product-variants';

/**
 * Order status enum
 * Matches backend OrderStatus enum
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Payment status enum
 * Matches backend PaymentStatus enum
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Shipping/Billing address
 * Matches backend AddressDto
 */
export interface OrderAddress {
  fullName: string;
  phone?: string;
  address: string;
  ward?: string;
  district?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/**
 * Order item (line item)
 * Matches order_items table schema
 */
export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string; // Snapshot at order time
  variantName?: string; // Snapshot at order time (e.g., "Red / XL")
  quantity: number;
  unitPrice: number; // Price in KRW
  totalPrice: number; // quantity * unitPrice

  // Populated from relations (optional)
  product?: Product;
  variant?: ProductVariantNormalized;
}

/**
 * Order with all details
 * Matches orders table schema + populated relations
 */
export interface Order {
  id: string;
  orderNumber: string; // Format: ORD-YYYYMMDD-XXXXX
  userId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // "sepay", "cod", etc.

  // Pricing
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;

  // Addresses (JSONB fields)
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;

  // Items
  items: OrderItem[];

  // Notes
  notes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Populated from relations (optional)
  user?: {
    id: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  };
}

/**
 * Create order DTO
 * Matches backend CreateOrderDto
 */
export interface CreateOrderDto {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  paymentMethod: string;
  shippingFee: number;
  discount?: number;
  notes?: string;
}

/**
 * Update order status DTO
 * Matches backend UpdateOrderStatusDto (admin only)
 */
export interface UpdateOrderStatusDto {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

/**
 * Order query params
 * Matches backend OrderQueryDto
 */
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Orders list response with pagination
 */
export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Order status display config
 */
export interface OrderStatusConfig {
  label: string;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red';
  icon?: string;
}

/**
 * Payment status display config
 */
export interface PaymentStatusConfig {
  label: string;
  color: 'gray' | 'green' | 'red' | 'yellow';
  icon?: string;
}
