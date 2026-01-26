"use client";

import Link from "next/link";
import Image from "next/image";
import { Product, ProductVariant } from "@/types";
import { findVariantByAttributes, ProductVariantNormalized } from "@/types/product-variants";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { getImageUrl } from "@/lib/image";
import { Badge } from "@/components/ui/badge";
import { Package, Minus, Plus, ShoppingCart, Eye, Heart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
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
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlist();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Wishlist state
  const isWishlisted = isInWishlist(product.id);

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
    if (typeof firstImage === 'string') return getImageUrl(firstImage);
    // If object (ProductWithNormalizedVariants type)
    if (typeof firstImage === 'object' && firstImage?.url) return getImageUrl(firstImage.url);
    return '';
  };

  const imageUrl = getFirstImageUrl();

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-primary/50 overflow-hidden">
      {/* Image Section */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[1/1] block bg-gray-50 overflow-hidden"
        onClick={handleCardClick}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Package className="w-12 h-12 text-gray-200" strokeWidth={1} />
          </div>
        )}

        {/* Badges - Clean & Modern */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.badges.map((badge) => (
              <Badge
                key={badge}
                className={cn(
                  "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 backdrop-blur-md shadow-sm",
                  badge === "flash-sale" && "bg-red-500 text-white",
                  badge === "new" && "bg-blue-500 text-white",
                  badge === "freeship" && "bg-green-500 text-white",
                  badge === "authentic" && "bg-purple-500 text-white",
                  badge === "best-seller" && "bg-amber-500 text-white"
                )}
              >
                {badge === "flash-sale" && "Flash Sale"}
                {badge === "new" && "Mới"}
                {badge === "freeship" && "Freeship"}
                {badge === "authentic" && "Chính hãng"}
                {badge === "best-seller" && "Bán chạy"}
              </Badge>
            ))}
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-0 z-10">
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-l-lg shadow-sm">
              -{discount}%
            </span>
          </div>
        )}

        {/* Action Buttons Overlay - Shows on hover */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary/95 backdrop-blur-sm px-4 py-2 rounded-t-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hidden md:flex">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const added = toggleWishlist(product.id);
              if (added) {
                toast.success("Đã thêm vào yêu thích", {
                  description: "Xem danh sách yêu thích của bạn.",
                  action: {
                    label: "Xem",
                    onClick: () => window.location.href = "/wishlist",
                  },
                });
              } else {
                toast.success("Đã xóa khỏi yêu thích");
              }
            }}
            className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200",
              isWishlisted
                ? "bg-white text-rose-500 border-white"
                : "border-dashed border-white text-white hover:bg-white hover:text-primary"
            )}
            aria-label={isWishlisted ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-rose-500")} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
            className="w-8 h-8 rounded-full border border-dashed border-white flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-200"
            aria-label="Xem nhanh sản phẩm"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <Link href={`/products/${product.slug}`} onClick={handleCardClick} className="group/title">
          <h3 className="font-medium text-gray-800 text-[15px] leading-snug line-clamp-2 h-10 group-hover/title:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Variants - Minimalist Pills */}
        <div className="h-7 flex items-center" ref={variantsContainerRef}>
          {optionsCount > 1 ? (
            <span className="text-xs text-gray-500 font-medium">Nhiều tùy chọn</span>
          ) : optionsCount === 1 && singleOptionValues ? (
            <div className="flex gap-1.5 items-center">
              {singleOptionValues.slice(0, visibleVariantsCount).map((value: any) => (
                <button
                  key={value.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAttributeValue(value.name);
                  }}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium rounded-full border transition-all duration-200",
                    selectedAttributeValue === value.name
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-transparent text-gray-600 hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {value.displayName || value.name}
                </button>
              ))}
              {singleOptionValues.length > visibleVariantsCount && (
                <span className="text-[10px] text-gray-400">+{singleOptionValues.length - visibleVariantsCount}</span>
              )}
            </div>
          ) : sortedVariants && sortedVariants.length > 0 ? (
            <div className="flex gap-1.5 items-center">
              {sortedVariants.slice(0, visibleVariantsCount).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (variant.stock > 0) setSelectedVariant(variant);
                  }}
                  disabled={variant.stock === 0}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium rounded-full border transition-all duration-200",
                    selectedVariant?.id === variant.id
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-transparent text-gray-600 hover:border-primary/50 hover:text-primary",
                    variant.stock === 0 && "opacity-40 cursor-not-allowed decoration-slice"
                  )}
                >
                  {variant.displayName || variant.name}
                </button>
              ))}
              {sortedVariants.length > visibleVariantsCount && (
                <span className="text-[10px] text-gray-400">+{sortedVariants.length - visibleVariantsCount}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">1 loại</span>
          )}
        </div>

        {/* Price Area */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(displayPrice)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Action Buttons - Simplified & Premium */}
        <div className="pt-2">
          {is_slider ? (
            <div className="flex gap-2">
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-200 rounded-full h-9 w-[100px] px-1 bg-white hover:border-primary/50 transition-colors">
                <button onClick={handleSliderDecrease} disabled={sliderQuantity <= 1} className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-30">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-gray-900">{sliderQuantity}</span>
                <button onClick={handleSliderIncrease} disabled={sliderQuantity >= maxStock} className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-30">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleSliderAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "flex-1 h-9 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm shadow-primary/20",
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/30"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          ) : (
            // Grid Mode
            cartQuantity > 0 ? (
              <div className="flex items-center justify-between border border-primary/20 rounded-full h-10 px-1 bg-primary/5 w-full">
                <button onClick={handleGridDecrease} className="w-10 h-full flex items-center justify-center text-primary/70 hover:text-red-600 hover:bg-red-100/50 rounded-l-full transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-primary">{cartQuantity}</span>
                <button onClick={handleGridIncrease} disabled={cartQuantity >= maxStock} className="w-10 h-full flex items-center justify-center text-primary/70 hover:text-primary hover:bg-white/50 rounded-r-full transition-colors disabled:opacity-30">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGridAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "w-full h-10 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm shadow-primary/20",
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm vào giỏ</span>
              </button>
            )
          )}
        </div>
      </div>

      <QuickViewModal
        product={product}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
      />
    </div>
  );
}
