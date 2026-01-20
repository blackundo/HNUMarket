"use client";

import { CartItemWithDetails, useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/image";
import { Package, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface CartItemRowProps {
  item: CartItemWithDetails;
}

/**
 * Single cart item row with checkbox, image, details, and quantity controls
 */
export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem, toggleItemSelection, selectedItems } = useCart();

  // Generate unique key based on attributes or variantId
  const itemKey = item.attributes
    ? `${item.productId}-${Object.entries(item.attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|')}`
    : item.variantId
      ? `${item.productId}-${item.variantId}`
      : item.productId;

  const isSelected = selectedItems.has(itemKey);

  // Use variant price if available, otherwise product price
  const itemPrice = item.variant?.price || item.product.price;
  const itemTotal = itemPrice * item.quantity;

  const handleQuantityDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.variantId, item.quantity - 1, item.attributes);
    }
  };

  const handleQuantityIncrease = () => {
    const maxStock = item.variant?.stock || item.product.stock;
    if (item.quantity < maxStock) {
      updateQuantity(item.productId, item.variantId, item.quantity + 1, item.attributes);
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleItemSelection(item.productId, item.variantId)}
          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mt-1"
        />

        {/* Product Image */}
        <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden relative">
            {item.product.images && item.product.images.length > 0 ? (
              <Image
                src={getImageUrl(item.product.images[0].url)}
                alt={item.product.images[0].alt_text || item.product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-sm sm:text-base font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 mb-1"
          >
            {item.product.name}
          </Link>

          {/* Display variant info - attributes or legacy name */}
          {item.attributes ? (
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              {Object.entries(item.attributes)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
          ) : item.variant ? (
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              {item.variant.name}
            </p>
          ) : null}

          {/* Price Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">
                {formatCurrency(itemPrice)}
              </span>
              <span className="text-base sm:text-lg font-bold text-primary">
                {formatCurrency(itemTotal)}
              </span>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleQuantityDecrease}
                disabled={item.quantity <= 1}
                className="h-8 w-8"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-12 text-center font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQuantityIncrease}
                className="h-8 w-8"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => removeItem(item.productId, item.variantId, item.attributes)}
            className="text-xs text-gray-500 hover:text-destructive transition-colors mt-2"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
