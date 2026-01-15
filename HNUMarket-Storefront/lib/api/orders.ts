import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';
import type {
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryParams,
  OrdersResponse,
} from '@/types/orders';

const API_URL = API_BASE_URL;

function normalizeOrderItem(raw: any): any {
  const product = raw.product ? { ...raw.product } : undefined;

  if (product?.images && Array.isArray(product.images)) {
    product.images = product.images
      .map((image: any) => (typeof image === 'string' ? image : image?.url))
      .filter((url: string | undefined) => Boolean(url));
  }

  return {
    id: raw.id,
    productId: raw.productId ?? raw.product_id,
    variantId: raw.variantId ?? raw.variant_id ?? undefined,
    productName: raw.productName ?? raw.product_name,
    variantName: raw.variantName ?? raw.variant_name ?? undefined,
    quantity: raw.quantity,
    unitPrice: raw.unitPrice ?? raw.unit_price ?? 0,
    totalPrice: raw.totalPrice ?? raw.total_price ?? 0,
    product: product ? (product as any) : undefined,
    variant: raw.variant ? (raw.variant as any) : undefined,
  };
}

function normalizeOrder(raw: any): Order {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.order_number,
    userId: raw.userId ?? raw.user_id ?? undefined,
    status: raw.status,
    paymentStatus: raw.paymentStatus ?? raw.payment_status,
    paymentMethod: raw.paymentMethod ?? raw.payment_method,
    subtotal: raw.subtotal ?? 0,
    shippingFee: raw.shippingFee ?? raw.shipping_fee ?? 0,
    discount: raw.discount ?? 0,
    total: raw.total ?? 0,
    shippingAddress: raw.shippingAddress ?? raw.shipping_address,
    billingAddress: raw.billingAddress ?? raw.billing_address ?? undefined,
    items: Array.isArray(raw.items) ? raw.items.map(normalizeOrderItem) : [],
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    user: raw.user
      ? {
          id: raw.user.id,
          fullName: raw.user.fullName ?? raw.user.full_name ?? undefined,
          email: raw.user.email ?? undefined,
          avatarUrl: raw.user.avatarUrl ?? raw.user.avatar_url ?? undefined,
        }
      : undefined,
  };
}

function buildQueryString(params?: OrderQueryParams): string {
  if (!params) return '';

  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]);

  if (entries.length === 0) return '';

  return `?${new URLSearchParams(entries).toString()}`;
}

/**
 * Get authentication headers with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Get optional auth headers (for endpoints that work with or without auth)
 */
async function getOptionalAuthHeaders(): Promise<HeadersInit> {
  try {
    return await getAuthHeaders();
  } catch {
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Create a new order
 * Public endpoint (guest or authenticated)
 */
export async function createOrder(data: CreateOrderDto): Promise<Order> {
  const headers = await getOptionalAuthHeaders();

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create order' }));
      throw new Error(error.message || 'Failed to create order');
    }

    const order = await response.json();
    return normalizeOrder(order);
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Yêu cầu tạo đơn hàng quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }

    throw error;
  }
}

/**
 * Get current user's orders
 * Requires authentication
 */
export async function getMyOrders(
  params?: OrderQueryParams
): Promise<OrdersResponse> {
  const headers = await getAuthHeaders();
  const queryString = buildQueryString(params);

  const response = await fetch(`${API_URL}/orders/my-orders${queryString}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch orders');
  }

  const result = await response.json();
  return {
    data: Array.isArray(result.data) ? result.data.map(normalizeOrder) : [],
    meta: result.meta,
  };
}

/**
 * Get all orders (Admin only)
 * Requires admin authentication
 */
export async function getAllOrders(
  params?: OrderQueryParams
): Promise<OrdersResponse> {
  const headers = await getAuthHeaders();
  const queryString = buildQueryString(params);

  const response = await fetch(`${API_URL}/orders${queryString}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch orders');
  }

  const result = await response.json();
  return {
    data: Array.isArray(result.data) ? result.data.map(normalizeOrder) : [],
    meta: result.meta,
  };
}

/**
 * Get order by ID
 * Requires authentication (admin or order owner)
 */
export async function getOrderById(id: string): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${id}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Order not found');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Get order by order number
 * Requires authentication (admin or order owner)
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  const headers = await getOptionalAuthHeaders();

  const response = await fetch(`${API_URL}/orders/number/${orderNumber}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Order not found');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Update order status (Admin only)
 * Requires admin authentication
 */
export async function updateOrderStatus(
  id: string,
  data: UpdateOrderStatusDto
): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order status');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Cancel order
 * Requires authentication (admin or order owner)
 * Only pending/confirmed orders can be cancelled
 */
export async function cancelOrder(id: string): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel order');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Order status labels and colors for UI
 */
export const ORDER_STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', color: 'yellow' as const },
  confirmed: { label: 'Đã xác nhận', color: 'blue' as const },
  processing: { label: 'Đang xử lý', color: 'blue' as const },
  shipped: { label: 'Đang giao', color: 'blue' as const },
  delivered: { label: 'Đã giao', color: 'green' as const },
  cancelled: { label: 'Đã hủy', color: 'red' as const },
};

/**
 * Payment status labels and colors for UI
 */
export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' as const },
  paid: { label: 'Đã thanh toán', color: 'green' as const },
  failed: { label: 'Thất bại', color: 'red' as const },
  refunded: { label: 'Đã hoàn tiền', color: 'gray' as const },
};

/**
 * Add item to existing order (Admin only)
 * Only allowed for pending/confirmed orders
 */
export async function addOrderItem(
  orderId: string,
  data: { productId: string; variantId?: string; quantity: number }
): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add item to order');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Update order item quantity (Admin only)
 */
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  data: { quantity: number }
): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order item');
  }

  const order = await response.json();
  return normalizeOrder(order);
}

/**
 * Remove item from order (Admin only)
 */
export async function removeOrderItem(
  orderId: string,
  itemId: string
): Promise<Order> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove order item');
  }

  const order = await response.json();
  return normalizeOrder(order);
}
