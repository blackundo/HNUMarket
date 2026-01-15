'use client';

import { useEffect, useRef } from 'react';
import { trackViewItem } from '@/lib/analytics/ga-ecommerce';
import type { Product } from '@/types';

interface ProductViewTrackerProps {
  product: {
    id: string;
    name: string;
    price: number;
    categoryId?: string;
  };
}

/**
 * Product View Tracker Component
 *
 * Tracks GA4 view_item event when a product detail page is viewed.
 * Prevents duplicate tracking using a ref keyed by product ID.
 */
export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const trackedProductId = useRef<string | null>(null);

  useEffect(() => {
    // Only track once per product
    if (trackedProductId.current === product.id) {
      return;
    }

    // Track view_item event
    trackViewItem({
      item: {
        item_id: product.id,
        item_name: product.name,
        item_category: product.categoryId,
        price: product.price,
        quantity: 1,
      },
      value: product.price,
      currency: 'KRW',
    });

    // Mark as tracked
    trackedProductId.current = product.id;
  }, [product.id, product.name, product.price, product.categoryId]);

  return null;
}
