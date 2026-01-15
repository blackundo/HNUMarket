"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Truck,
  PhoneCall,
  ShieldCheck,
  ThumbsUp,
  Undo2,
  Check,
} from "lucide-react";
import { ProductWithNormalizedVariants } from "@/types";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "./quantity-selector";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/cart-context";
import { MobileProductCTA } from "./mobile-product-cta";
import {
  CraftButton,
  CraftButtonIcon,
  CraftButtonLabel,
} from "@/components/ui/craft-button";
import { useVariantSelection } from "@/hooks/use-variant-selection";
import { VariantSelector } from "./variant-selector";
import { VariantPriceDisplay } from "./variant-price-display";
import { hasStock } from "@/types/product-variants";

interface ProductInfoNormalizedProps {
  product: ProductWithNormalizedVariants;
}

/**
 * Product Information Component (Normalized Multi-Attribute Variants)
 *
 * UI giống product-info.tsx, chỉ thay phần variant selection bằng VariantSelector mới
 */
export function ProductInfoNormalized({ product }: ProductInfoNormalizedProps) {
  const router = useRouter();
  const { addItem, items } = useCart();

  // Variant selection hook
  const {
    selectedAttributes,
    selectedVariant,
    isComplete,
    selectAttribute,
    getAvailableValues,
    isValueSelected,
    isValueAvailable,
  } = useVariantSelection(product);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Check if product has variants
  const hasVariants = product.options && product.options.length > 0;

  // Determine current stock
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = !hasStock(product);

  // Can add to cart if:
  // 1. Product has stock
  // 2. If has variants, all attributes must be selected
  const canAddToCart = !isOutOfStock && (!hasVariants || isComplete);

  const handleAddToCart = () => {
    if (!canAddToCart) {
      console.error("Cannot add to cart", { hasVariants, isComplete, isOutOfStock });
      return;
    }

    setIsAdding(true);

    // Add to cart with attributes instead of variant ID
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      attributes: hasVariants ? selectedAttributes : undefined,
      quantity,
    });

    // Show success feedback
    setShowAdded(true);
    setTimeout(() => {
      setShowAdded(false);
      setIsAdding(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (!canAddToCart) {
      console.error("Cannot buy now", { hasVariants, isComplete, isOutOfStock });
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      attributes: hasVariants ? selectedAttributes : undefined,
      quantity,
    });

    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Product Name */}
      <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Tình trạng:</span>
        {!isOutOfStock ? (
          <span className="text-xs text-primary">Còn hàng</span>
        ) : (
          <span className="text-xs text-red-900">Hết hàng</span>
        )}
      </div>

      {/* Price - Sử dụng VariantPriceDisplay component mới */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-3 items-baseline sm:items-center">
          <span className="text-base hidden sm:block text-black w-24">Giá:</span>
          <VariantPriceDisplay
            product={product}
            selectedVariant={selectedVariant}
            showRange={false}
          />
        </div>
      </div>

      {/* Variants - Sử dụng VariantSelector component mới (chỉ phần này thay đổi) */}
      {hasVariants && (
        <VariantSelector
          options={product.options}
          selectedAttributes={selectedAttributes}
          onSelect={selectAttribute}
          getAvailableValues={getAvailableValues}
          isValueSelected={isValueSelected}
          isValueAvailable={isValueAvailable}
        />
      )}

      {/* Quantity - Hidden on mobile */}
      <div className="hidden md:flex flex-col gap-2 w-full">
        <QuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          max={currentStock}
        />
      </div>

      {/* Action Buttons - Hidden on mobile */}
      <div className="hidden md:flex flex-col sm:flex-row gap-4">
        <CraftButton
          className="w-full sm:flex-1 h-14 font-bold rounded-full border border-primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={isOutOfStock || !canAddToCart || isAdding}
        >
          {showAdded ? (
            <>
              <CraftButtonLabel className="text-primary">
                Đã thêm
              </CraftButtonLabel>
              <CraftButtonIcon>
                <Check className="size-3 stroke-2 transition-transform duration-500 group-hover:rotate-45" />
              </CraftButtonIcon>
            </>
          ) : (
            <>
              <CraftButtonLabel className="text-primary">
                THÊM VÀO GIỎ
              </CraftButtonLabel>
              <CraftButtonIcon>
                <ShoppingCart className="size-3 stroke-2 transition-transform duration-500 -rotate-45 group-hover:rotate-0" />
              </CraftButtonIcon>
            </>
          )}
        </CraftButton>
        <Button
          className="w-full sm:flex-1 h-14 text-base font-bold rounded-full shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-white"
          onClick={handleBuyNow}
          disabled={isOutOfStock || !canAddToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          MUA NGAY
        </Button>
      </div>

      {/* Mobile CTA - Only visible on mobile */}
      <MobileProductCTA
        product={product as any}
        selectedVariant={selectedVariant as any}
        hasVariants={!!hasVariants}
        canAddToCart={canAddToCart}
        isOutOfStock={isOutOfStock}
        currentStock={currentStock}
        hasCartBar={items.length > 0}
      />

      <Separator className="my-4" />

      {/* Service & Guarantee badges - Giống nguyên product-info.tsx */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-400" />
          <span className="text-gray-800 font-medium">
            Cam kết 100% chính hãng
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-400" />
          <span className="text-gray-800 font-medium">Miễn phí giao hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-gray-400" />
          <span className="text-gray-800 font-medium">Hỗ trợ 24/7</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-gray-800 font-medium">
            Hoàn tiền 111% nếu hàng giả
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-primary" />
          <span className="text-gray-800 font-medium">
            Mở hộp kiểm tra nhận hàng
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Undo2 className="w-5 h-5 text-primary" />
          <span className="text-gray-800 font-medium">Đổi trả trong 7 ngày</span>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Product Details (Description + Specifications) - Giống nguyên product-info.tsx */}
      {(product.description || product.specifications) && (
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg mb-1">Chi tiết sản phẩm</h3>

          <div className="relative">
            <div
              className={`overflow-hidden transition-all duration-300 ${isDetailsExpanded ? "max-h-[1000px]" : "max-h-40"
                }`}
            >
              {product.description && (
                <div
                  className="text-sm text-gray-700 leading-relaxed mb-3 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {product.specifications && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-gray-900">
                    Thông số kỹ thuật
                  </h4>
                  <div className="grid gap-2">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm text-gray-600 w-1/3">
                            {key}:
                          </span>
                          <span className="text-sm font-medium text-gray-900 w-2/3">
                            {value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isDetailsExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent" />
            )}
          </div>

          <div className="mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-primary"
              onClick={() => setIsDetailsExpanded((prev) => !prev)}
            >
              {isDetailsExpanded ? "Thu gọn" : "Xem thêm"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
