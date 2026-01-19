"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingCart,
  MessageCircle,
  Check,
  Package,
  Truck,
  PhoneCall,
  ShieldCheck,
  ThumbsUp,
  Undo2,
} from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { calculatePricePerUnit } from "@/lib/helpers/unit-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "./quantity-selector";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/cart-context";
import { MobileProductCTA } from "./mobile-product-cta";
import {
  CraftButton,
  CraftButtonIcon,
  CraftButtonLabel,
} from "@/components/ui/craft-button";
import { toast } from "sonner";

interface ProductInfoProps {
  product: Product;
}

/**
 * Product information section with variants, quantity selector, and actions
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { addItem, items } = useCart();

  // Sort variants by conversionRate to get smallest unit first (goi = 1)
  const sortedVariants = useMemo(() => {
    return product.variants?.slice().sort((a, b) => a.conversionRate - b.conversionRate);
  }, [product.variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    sortedVariants?.[0]?.id || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const selectedVariant = sortedVariants?.find(
    (v: ProductVariant) => v.id === selectedVariantId
  );

  // Use variant price if selected, otherwise product price
  const displayPrice = selectedVariant?.price ?? product.price;
  const pricePerUnit = selectedVariant
    ? calculatePricePerUnit(selectedVariant.price, selectedVariant.conversionRate)
    : null;

  // Determine if product has variants and check stock accordingly
  const hasVariants = sortedVariants && sortedVariants.length > 0;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock === 0;

  // Validation: If product has variants, variant must be selected
  const canAddToCart = hasVariants ? selectedVariantId !== null : true;

  const handleAddToCart = () => {
    // Defensive validation: ensure variant is selected when product has variants
    if (hasVariants && !selectedVariantId) {
      console.error('Cannot add to cart: variant must be selected');
      return;
    }

    setIsAdding(true);
    addItem({
      productId: product.id,
      variantId: selectedVariantId || undefined,
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
    // Defensive validation: ensure variant is selected when product has variants
    if (hasVariants && !selectedVariantId) {
      console.error('Cannot buy now: variant must be selected');
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariantId || undefined,
      quantity,
    });
    router.push("/cart");
  };

  const handleContactNow = () => {
    // TODO: Implement Messenger integration
    toast("Chức năng liên hệ qua Messenger đang được phát triển");
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
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs text-gray-600">
          Đã bán: <span className="font-medium text-gray-900">{product.sold}</span>
        </span>
      </div>


      {/* Price */}
      <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-3 items-baseline sm:items-center">
          <span className="text-base hidden sm:block text-black w-24">Giá:</span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl lg:text-4xl font-bold text-[#FF0000]">
              {formatCurrency(displayPrice)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
        {pricePerUnit && selectedVariant && selectedVariant.conversionRate > 1 && (
          <span className="text-sm text-gray-500 ml-12">
            ({formatCurrency(pricePerUnit)}/gói)
          </span>
        )}
      </div>

      {/* Variants (Unit-based) */}
      {sortedVariants && sortedVariants.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold text-gray-900">
            {sortedVariants[0].type === "unit" ? "Khối lượng:" :
              sortedVariants[0].type === "size" ? "Kích thước:" :
                "Màu sắc:"}
          </span>
          <div className="flex flex-wrap gap-3">
            {sortedVariants.map((variant: ProductVariant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1); // Reset quantity when switching variants
                }}
                disabled={variant.stock === 0}
                className={`
                  relative px-4 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                  ${selectedVariantId === variant.id
                    ? 'bg-primary/5 border-2 border-primary shadow-sm'
                    : 'bg-white border border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }
                  ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="font-medium text-xs sm:text-sm">
                  {variant.displayName || variant.name}
                </span>
                {selectedVariantId === variant.id && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
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
        product={product}
        selectedVariant={selectedVariant}
        hasVariants={!!hasVariants}
        canAddToCart={canAddToCart}
        isOutOfStock={isOutOfStock}
        currentStock={currentStock}
        hasCartBar={items.length > 0}
      />

      <Separator className="my-4" />

      {/* Service & Guarantee badges */}
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

      {/* Product Details (Description + Specifications) */}
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

              {/* {product.specifications && (
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
              )} */}
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
