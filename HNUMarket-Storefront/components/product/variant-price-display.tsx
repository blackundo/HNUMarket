"use client";

import { formatCurrency } from "@/lib/utils";
import {
  ProductWithNormalizedVariants,
  ProductVariantNormalized,
  getDiscountPercentage,
  getVariantPriceRange,
} from "@/types";
import { Badge } from "@/components/ui/badge";

interface VariantPriceDisplayProps {
  product: ProductWithNormalizedVariants;
  selectedVariant?: ProductVariantNormalized;
  showRange?: boolean;
  className?: string;
}

/**
 * Variant Price Display Component
 *
 * Shows:
 * - Selected variant price with original price (if discount)
 * - Price range when no variant selected
 * - Discount badge
 *
 * @example
 * <VariantPriceDisplay
 *   product={product}
 *   selectedVariant={selectedVariant}
 *   showRange={true}
 * />
 */
export function VariantPriceDisplay({
  product,
  selectedVariant,
  showRange = true,
  className,
}: VariantPriceDisplayProps) {
  // If variant is selected, show its price
  if (selectedVariant) {
    const discount = getDiscountPercentage(
      selectedVariant.price,
      selectedVariant.originalPrice
    );

    return (
      <div className={className}>
        <div className="flex items-baseline gap-3">
          {/* Current Price */}
          <span className="text-3xl font-bold text-[#FF0000]">
            {formatCurrency(selectedVariant.price)}
          </span>

          {/* Original Price (if discount) */}
          {selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
            <span className="text-lg text-gray-400 line-through">
              {formatCurrency(selectedVariant.originalPrice)}
            </span>
          )}

          {/* Discount Badge */}
          {discount && (
            <Badge variant="sale" className="text-sm">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Stock Warning */}
        {selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
          <p className="text-sm text-primary mt-1">
            Chỉ còn {selectedVariant.stock} sản phẩm
          </p>
        )}
      </div>
    );
  }

  // No variant selected - show price range or base price
  if (showRange && product.variants && product.variants.length > 0) {
    const priceRange = getVariantPriceRange(product.variants);

    if (priceRange && priceRange.min !== priceRange.max) {
      return (
        <div className={className}>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FF0000]">
              {formatCurrency(priceRange.min)}
            </span>
            <span className="text-lg text-gray-500">-</span>
            <span className="text-3xl font-bold text-[#FF0000]">
              {formatCurrency(priceRange.max)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Giá tùy thuộc vào lựa chọn
          </p>
        </div>
      );
    }
  }

  // Fallback: show base product price
  const discount = getDiscountPercentage(product.price, product.originalPrice);

  return (
    <div className={className}>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#FF0000]">
          {formatCurrency(product.price)}
        </span>

        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-lg text-gray-400 line-through">
            {formatCurrency(product.originalPrice)}
          </span>
        )}

        {discount && (
          <Badge variant="sale" className="text-sm">
            -{discount}%
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Price Display (for product cards)
 */
interface CompactPriceDisplayProps {
  product: ProductWithNormalizedVariants;
  className?: string;
}

export function CompactPriceDisplay({
  product,
  className,
}: CompactPriceDisplayProps) {
  const priceRange = product.variants?.length
    ? getVariantPriceRange(product.variants)
    : null;

  const hasRange = priceRange && priceRange.min !== priceRange.max;
  const displayPrice = hasRange ? priceRange.min : product.price;
  const discount = getDiscountPercentage(displayPrice, product.originalPrice);

  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        {/* Price */}
        <span className="text-lg font-bold text-[#FF0000]">
          {hasRange && <span className="text-sm font-normal">Từ </span>}
          {formatCurrency(displayPrice)}
        </span>

        {/* Original Price */}
        {product.originalPrice && product.originalPrice > displayPrice && (
          <span className="text-sm text-gray-400 line-through">
            {formatCurrency(product.originalPrice)}
          </span>
        )}
      </div>

      {/* Discount Badge */}
      {discount && (
        <Badge variant="sale" className="mt-1 text-xs">
          -{discount}%
        </Badge>
      )}
    </div>
  );
}
