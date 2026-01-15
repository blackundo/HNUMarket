"use client";

import Link from "next/link";
import Image from "next/image";
import { Product, ProductVariant } from "@/types";
import { findVariantByAttributes, ProductVariantNormalized } from "@/types/product-variants";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Package, Minus, Plus, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { QuickViewModal } from "./quick-view-modal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  is_slider?: boolean; // Flag to indicate if card is in slider mode (default: false for grid)
}

export function ProductCard({ product, is_slider = false }: ProductCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Sort variants by conversionRate to get smallest unit first (goi = 1)
  // Filter out inactive variants (if isActive field exists)
  const sortedVariants = useMemo(() => {
    const variants = product.variants?.slice() || [];
    // Filter by isActive if the field exists (for normalized variants)
    const activeVariants = variants.filter((v: any) => v.isActive !== false);
    return activeVariants.sort((a, b) => a.conversionRate - b.conversionRate);
  }, [product.variants]);

  // Default to smallest unit (first variant after sorting)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    sortedVariants?.[0]
  );
  const [visibleVariantsCount, setVisibleVariantsCount] = useState(3);
  const variantsContainerRef = useRef<HTMLDivElement>(null);

  // === SLIDER MODE: Local quantity state (independent from cart) ===
  const [sliderQuantity, setSliderQuantity] = useState(1);

  // === QUICK VIEW MODAL STATE ===
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Check if product has multi-attribute variants (normalized system)
  const hasMultiAttributeVariants = !!(product as any).options && (product as any).options.length > 0;
  const optionsCount = (product as any).options?.length || 0;

  // Extract single option values for display (when product has exactly 1 attribute)
  // Only show values that have at least one active variant
  const singleOptionValues = useMemo(() => {
    if (optionsCount !== 1) return null;
    const option = (product as any).options[0];
    if (!option?.values) return null;

    // Get all active variants
    const activeVariants = ((product as any).variants || []).filter(
      (v: any) => v.isActive !== false
    );

    // Filter option values to only include those with active variants
    const availableValues = option.values.filter((v: any) => {
      const optionName = option.name;
      return activeVariants.some(
        (variant: any) => variant.attributes?.[optionName] === v.value
      );
    });

    // Transform option values to variant-like format for display
    return availableValues.map((v: any) => ({
      id: v.id,
      name: v.value,
      displayName: v.value,
    }));
  }, [optionsCount, product]);

  // State for selected attribute value (for single-attribute products)
  const [selectedAttributeValue, setSelectedAttributeValue] = useState<string | null>(
    singleOptionValues?.[0]?.name || null
  );

  // Find matching variant for single-attribute products
  const singleAttrSelectedVariant = useMemo(() => {
    if (optionsCount !== 1 || !selectedAttributeValue) return undefined;
    const optionName = (product as any).options[0].name;
    const variants = (product as any).variants as ProductVariantNormalized[];
    if (!variants) return undefined;

    return findVariantByAttributes(variants, { [optionName]: selectedAttributeValue });
  }, [optionsCount, selectedAttributeValue, product]);

  // === GRID MODE: Cart-synced quantity ===
  // Use appropriate variant based on product type
  const cartVariantId = optionsCount === 1 ? singleAttrSelectedVariant?.id : selectedVariant?.id;
  const cartQuantity = getItemQuantity(product.id, cartVariantId);

  // Reset slider quantity when variant changes (slider mode only)
  useEffect(() => {
    if (is_slider) {
      setSliderQuantity(1);
    }
  }, [selectedVariant?.id, is_slider]);

  // Calculate how many variants can fit in the container
  // Skip for multi-attribute products with >1 option (they show "Nhiều tuỳ chọn" text)
  useEffect(() => {
    // Skip calculation for products with multiple attributes (>1 option)
    if (optionsCount > 1) return;

    // For single-attribute multi-attr products, use singleOptionValues
    // For legacy products, use sortedVariants
    const itemsToCalculate = singleOptionValues || sortedVariants;
    if (!variantsContainerRef.current || !itemsToCalculate || itemsToCalculate.length <= 1) return;

    const calculateVisibleVariants = () => {
      const container = variantsContainerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      // Reserve space for "+X" badge (approximately 45px) and gaps
      const plusBadgeWidth = 45;
      const gapSpace = 6; // gap-1.5 = 6px
      let accumulatedWidth = 0;
      let count = 0;

      // Estimate button width based on text length
      // Formula: padding (20px) + (character count * ~7px per char) + border (2px)
      const estimateButtonWidth = (text: string) => {
        if (!text) return 40; // Default width if text is undefined
        const charWidth = 7; // Average character width in pixels for text-xs font
        return 20 + (text.length * charWidth) + 2;
      };

      for (let i = 0; i < itemsToCalculate.length; i++) {
        const variantText = itemsToCalculate[i]?.displayName || itemsToCalculate[i]?.name || '';
        const buttonWidth = estimateButtonWidth(variantText);
        const totalWidth = accumulatedWidth + buttonWidth + (i > 0 ? gapSpace : 0);

        // Check if adding this button + "+X" badge would overflow
        const wouldOverflow = totalWidth + (i < itemsToCalculate.length - 1 ? plusBadgeWidth + gapSpace : 0) > containerWidth;

        if (!wouldOverflow) {
          accumulatedWidth = totalWidth;
          count++;
        } else {
          break;
        }
      }

      // If all variants fit, show all. Otherwise ensure at least 1 variant + "+X" badge
      const finalCount = count === 0 ? 1 : Math.min(count, itemsToCalculate.length);
      setVisibleVariantsCount(finalCount);
    };

    // Delay calculation to ensure container has rendered with correct width
    const timer = setTimeout(calculateVisibleVariants, 0);

    window.addEventListener('resize', calculateVisibleVariants);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateVisibleVariants);
    };
  }, [sortedVariants, hasMultiAttributeVariants]);

  // Determine active variant based on product type
  const activeVariant = optionsCount === 1
    ? singleAttrSelectedVariant
    : selectedVariant;

  // Use variant price if selected, otherwise product price
  const displayPrice = activeVariant?.price ?? product.price;
  const maxStock = activeVariant?.stock ?? product.stock ?? 99;

  // Validation: Check if product has variants
  const hasVariants = sortedVariants && sortedVariants.length > 0;
  const isOutOfStock = maxStock === 0;

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, displayPrice)
    : 0;

  // === SLIDER MODE HANDLERS: Update local state only ===
  const handleSliderDecrease = () => {
    setSliderQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleSliderIncrease = () => {
    setSliderQuantity((prev) => Math.min(prev + 1, maxStock));
  };

  const handleSliderAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If multi-attribute product with >1 option, open modal instead
    if (optionsCount > 1) {
      setIsQuickViewOpen(true);
      return;
    }

    // For single-attribute products, use singleAttrSelectedVariant
    const variantToAdd = optionsCount === 1 ? singleAttrSelectedVariant : selectedVariant;

    // Defensive validation
    if (hasVariants && !variantToAdd && optionsCount === 0) {
      console.error('Cannot add to cart: variant must be selected');
      return;
    }

    // Build attributes for single-attribute products
    const attributes = optionsCount === 1 && selectedAttributeValue
      ? { [(product as any).options[0].name]: selectedAttributeValue }
      : undefined;

    // Add to cart with slider quantity
    addItem({
      productId: product.id,
      variantId: variantToAdd?.id,
      attributes,
      quantity: sliderQuantity,
    });
    toast.success("Đã thêm vào giỏ hàng", {
      description: "Bạn có thể đặt hàng ngay trong giỏ.",
    });
  };

  // === GRID MODE HANDLERS: Update cart directly ===
  const handleGridDecrease = () => {
    const newQuantity = cartQuantity - 1;
    // updateQuantity will remove item if quantity becomes 0
    updateQuantity(product.id, cartVariantId, newQuantity);
  };

  const handleGridIncrease = () => {
    const newQuantity = Math.min(cartQuantity + 1, maxStock);
    updateQuantity(product.id, cartVariantId, newQuantity);
  };

  const handleGridAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If multi-attribute product with >1 option, open modal instead
    if (optionsCount > 1) {
      setIsQuickViewOpen(true);
      return;
    }

    // For single-attribute products, use singleAttrSelectedVariant
    const variantToAdd = optionsCount === 1 ? singleAttrSelectedVariant : selectedVariant;

    // Defensive validation
    if (hasVariants && !variantToAdd && optionsCount === 0) {
      console.error('Cannot add to cart: variant must be selected');
      return;
    }

    // Build attributes for single-attribute products
    const attributes = optionsCount === 1 && selectedAttributeValue
      ? { [(product as any).options[0].name]: selectedAttributeValue }
      : undefined;

    // Add 1 item to cart (first click in grid mode)
    addItem({
      productId: product.id,
      variantId: variantToAdd?.id,
      attributes,
      quantity: 1,
    });
    toast.success("Đã thêm vào giỏ hàng", {
      description: "Bạn có thể đặt hàng ngay trong giỏ.",
    });
  };


  // Handle card click on mobile
  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsQuickViewOpen(true);
    }
  };

  // Extract first image URL (handle both string[] and object[] formats)
  const getFirstImageUrl = (): string => {
    if (!product.images || product.images.length === 0) return '';
    const firstImage = product.images[0] as any;
    // If string (legacy Product type)
    if (typeof firstImage === 'string') return firstImage;
    // If object (ProductWithNormalizedVariants type)
    if (typeof firstImage === 'object' && firstImage?.url) return firstImage.url;
    return '';
  };

  const imageUrl = getFirstImageUrl();

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square bg-gray-50 overflow-hidden"
        onClick={handleCardClick}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
            <Package className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
          </div>
        )}

        {/* Quick View Button - Shows on hover (Desktop only, hidden on mobile via CSS to avoid hydration mismatch) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsQuickViewOpen(true);
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/90 shadow-lg hover:shadow-xl rounded-full p-3 hidden md:block"
          aria-label="Xem nhanh sản phẩm"
        >
          <Eye className="w-5 h-5 text-gray-700" />
        </button>

        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.badges.map((badge) => (
              <Badge key={badge} variant={badge}>
                {badge === "flash-sale" && "FLASH SALE"}
                {badge === "new" && "MỚI"}
                {badge === "freeship" && "FREESHIP"}
                {badge === "authentic" && "CHÍNH HÃNG"}
                {badge === "best-seller" && "BÁN CHẠY"}
              </Badge>
            ))}
          </div>
        )}

        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs sm:text-sm font-bold">
            -{discount}%
          </div>
        )}
      </Link>

      {/* Content - Fixed height sections */}
      <div className="flex flex-col p-4 gap-3 flex-1">
        {/* Product Name - Fixed 2 lines */}
        <Link href={`/products/${product.slug}`} onClick={handleCardClick}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 h-10 group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Variants - Fixed height container with overflow handling */}
        <div className="h-8 flex items-center" ref={variantsContainerRef}>
          {optionsCount > 1 ? (
            // Multi-attribute variants (>1 option): Show "Nhiều tuỳ chọn" text

            <Link href={`/products/${product.slug}`} className="text-xs font-medium text-muted-foreground ransition-colors" onClick={handleCardClick}>
              Nhiều tuỳ chọn
            </Link>
          ) : optionsCount === 1 && singleOptionValues ? (
            // Single-attribute multi-attr product: Show option values as buttons
            <div className="flex gap-1.5 items-center">
              {singleOptionValues.slice(0, visibleVariantsCount).map((value: any) => (
                <button
                  key={value.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAttributeValue(value.name); // Select this value
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap",
                    selectedAttributeValue === value.name
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50 hover:text-gray-900"
                  )}
                >
                  {value.displayName || value.name}
                </button>
              ))}
              {singleOptionValues.length > visibleVariantsCount && (
                <Link href={`/products/${product.slug}`}
                  className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100"
                  onClick={handleCardClick}>
                  +{singleOptionValues.length - visibleVariantsCount}
                </Link>
              )}
            </div>
          ) : sortedVariants && sortedVariants.length > 0 ? (
            // Legacy single-attribute variants: Show variant buttons
            <div className="flex gap-1.5 items-center">
              {sortedVariants.slice(0, visibleVariantsCount).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(variant);
                    // Note: quantity reset is handled by useEffect for slider mode
                    // Grid mode uses cartQuantity which auto-updates
                  }}
                  disabled={variant.stock === 0}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap",
                    selectedVariant?.id === variant.id
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50 hover:text-gray-900",
                    variant.stock === 0 && "opacity-40"
                  )}
                >
                  {variant.displayName || variant.name}
                </button>
              ))}
              {sortedVariants.length > visibleVariantsCount && (
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full">
                  +{sortedVariants.length - visibleVariantsCount}
                </span>
              )}
            </div>
          ) : (
            // No variants: Show stock status
            <Link href={`/products/${product.slug}`} className={cn("text-xs font-medium text-muted-foreground w-full h-full")} onClick={handleCardClick}>
              {/* {isOutOfStock ? "Hết hàng" : "Còn hàng"} */}
              1 loại
            </Link>
          )}
        </div>

        {/* Price */}
        <Link href={`/products/${product.slug}`} onClick={handleCardClick} className="flex items-baseline gap-2 mt-auto">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(displayPrice)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </Link>

        {/* Actions Row */}
        <div className="flex items-center gap-2 pt-2">
          {is_slider ? (
            // === SLIDER MODE: Always show quantity input + add button ===
            <>
              <div className="flex items-stretch border border-gray-300 rounded-xl overflow-hidden bg-gray-50/30 h-10">
                <button
                  type="button"
                  onClick={handleSliderDecrease}
                  className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                  disabled={sliderQuantity <= 1}
                  aria-label="Giảm số lượng"
                >
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="w-8 flex items-center justify-center text-sm font-semibold text-gray-900">
                  {sliderQuantity}
                </span>
                <button
                  type="button"
                  onClick={handleSliderIncrease}
                  className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                  disabled={sliderQuantity >= maxStock}
                  aria-label="Tăng số lượng"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSliderAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "flex-1 group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg active:scale-95",
                  isOutOfStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="pointer-events-none absolute left-[-50px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-transparent transition-all duration-500 group-hover:translate-x-[60px] group-hover:rounded-[40px]">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <span className="pointer-events-none flex h-full items-center justify-center text-sm transition-transform duration-500 group-hover:translate-x-[8px]">
                  Thêm giỏ
                </span>
              </button>
            </>
          ) : (
            // === GRID MODE: Show quantity input if in cart, else show add button ===
            <>
              {cartQuantity > 0 ? (
                // Item in cart - show quantity input only (full width)
                <div className="flex items-stretch border border-gray-300 rounded-xl overflow-hidden bg-gray-50/30 flex-1 h-10">
                  <button
                    type="button"
                    onClick={handleGridDecrease}
                    className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                    disabled={cartQuantity <= 0}
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <span className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-900">
                    {cartQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleGridIncrease}
                    className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                    disabled={cartQuantity >= maxStock}
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ) : (
                // Item not in cart - show add button only (full width)
                <button
                  type="button"
                  onClick={handleGridAddToCart}
                  disabled={isOutOfStock}
                  className={cn(
                    "flex-1 w-full group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg active:scale-95",
                    isOutOfStock && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="pointer-events-none absolute left-[-50px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-transparent transition-all duration-500 group-hover:translate-x-[60px] group-active:translate-x-[300px] group-hover:rounded-[40px]">
                    <ShoppingCart className="w-4 h-4" />
                  </span>
                  <span className="pointer-events-none flex h-full items-center justify-center text-sm transition-transform duration-700 group-hover:translate-x-[8px] group-active:translate-x-[170px]">
                    Thêm giỏ
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
      />
    </div>
  );
}
