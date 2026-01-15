/**
 * Google Analytics 4 Ecommerce Event Wrappers
 *
 * Provides typed functions for tracking ecommerce events according to GA4 recommendations:
 * - trackViewItem: When a user views a product detail page
 * - trackAddToCart: When a user adds items to cart
 * - trackBeginCheckout: When a user starts the checkout process
 * - trackPurchase: When a purchase is completed
 *
 * References:
 * - https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

import { gaEvent } from './ga';

/**
 * GA4 Item structure
 */
export interface GAItem {
  /** Product ID (required) */
  item_id: string;
  /** Product name (required) */
  item_name: string;
  /** Product category */
  item_category?: string;
  /** Product category level 2 */
  item_category2?: string;
  /** Product category level 3 */
  item_category3?: string;
  /** Product variant (e.g., size, color) */
  item_variant?: string;
  /** Product brand */
  item_brand?: string;
  /** Unit price */
  price?: number;
  /** Quantity */
  quantity?: number;
  /** Item list name (for list context) */
  item_list_name?: string;
  /** Item list ID */
  item_list_id?: string;
  /** Item position in list */
  index?: number;
}

/**
 * Track when user views a product detail page
 *
 * @example
 * trackViewItem({
 *   item: {
 *     item_id: 'SKU123',
 *     item_name: 'Áo Thun Nam',
 *     item_category: 'Thời trang',
 *     price: 299000,
 *   },
 *   value: 299000,
 *   currency: 'VND',
 * })
 */
export function trackViewItem(params: {
  item: GAItem;
  value: number;
  currency?: string;
}): void {
  gaEvent('view_item', {
    currency: params.currency || 'KRW',
    value: params.value,
    items: [params.item],
  });
}

/**
 * Track when user adds item(s) to cart
 *
 * @example
 * trackAddToCart({
 *   items: [{
 *     item_id: 'SKU123',
 *     item_name: 'Áo Thun Nam',
 *     price: 299000,
 *     quantity: 1,
 *   }],
 *   value: 299000,
 *   currency: 'VND',
 * })
 */
export function trackAddToCart(params: {
  items: GAItem[];
  value: number;
  currency?: string;
}): void {
  gaEvent('add_to_cart', {
    currency: params.currency || 'KRW',
    value: params.value,
    items: params.items,
  });
}

/**
 * Track when user removes item(s) from cart
 *
 * @example
 * trackRemoveFromCart({
 *   items: [{
 *     item_id: 'SKU123',
 *     item_name: 'Áo Thun Nam',
 *     price: 299000,
 *     quantity: 1,
 *   }],
 *   value: 299000,
 *   currency: 'VND',
 * })
 */
export function trackRemoveFromCart(params: {
  items: GAItem[];
  value: number;
  currency?: string;
}): void {
  gaEvent('remove_from_cart', {
    currency: params.currency || 'KRW',
    value: params.value,
    items: params.items,
  });
}

/**
 * Track when user begins checkout process
 *
 * @example
 * trackBeginCheckout({
 *   items: cartItems,
 *   value: 599000,
 *   currency: 'VND',
 * })
 */
export function trackBeginCheckout(params: {
  items: GAItem[];
  value: number;
  currency?: string;
  coupon?: string;
}): void {
  gaEvent('begin_checkout', {
    currency: params.currency || 'KRW',
    value: params.value,
    coupon: params.coupon,
    items: params.items,
  });
}

/**
 * Track completed purchase
 *
 * @example
 * trackPurchase({
 *   transaction_id: 'ORDER-12345',
 *   affiliation: 'HNUMarket Store',
 *   items: orderItems,
 *   value: 599000,
 *   tax: 0,
 *   shipping: 30000,
 *   currency: 'VND',
 * })
 */
export function trackPurchase(params: {
  /** Unique transaction ID (required) */
  transaction_id: string;
  /** Store or affiliation name */
  affiliation?: string;
  /** Order items (required) */
  items: GAItem[];
  /** Total transaction value (required) */
  value: number;
  /** Tax amount */
  tax?: number;
  /** Shipping cost */
  shipping?: number;
  /** Currency code */
  currency?: string;
  /** Coupon code used */
  coupon?: string;
}): void {
  gaEvent('purchase', {
    transaction_id: params.transaction_id,
    affiliation: params.affiliation,
    currency: params.currency || 'KRW',
    value: params.value,
    tax: params.tax || 0,
    shipping: params.shipping || 0,
    coupon: params.coupon,
    items: params.items,
  });
}

/**
 * Helper: Convert cart item to GA4 item format
 *
 * This is a utility function to transform your app's cart items
 * into the GA4 item format. Adjust the mapping based on your data structure.
 *
 * @example
 * const gaItems = cartItems.map(item => convertCartItemToGAItem(item))
 */
export function convertCartItemToGAItem(cartItem: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  variant?: string;
}): GAItem {
  return {
    item_id: cartItem.id,
    item_name: cartItem.name,
    item_category: cartItem.category,
    item_variant: cartItem.variant,
    price: cartItem.price,
    quantity: cartItem.quantity,
  };
}
