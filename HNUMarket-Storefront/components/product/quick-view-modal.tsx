"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Check, ShoppingCart, Link2 } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { calculatePricePerUnit } from "@/lib/helpers/unit-display";
import { useVariantSelection } from "@/hooks/use-variant-selection";
import { VariantSelector } from "./variant-selector";
import { VariantPriceDisplay } from "./variant-price-display";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerHeader,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "./quantity-selector";
import { ProductImageGallery } from "./product-image-gallery";
import { useCart } from "@/contexts/cart-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { MobileProductCTA } from "./mobile-product-cta";

interface QuickViewModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quick view modal for product with 2-column layout
 * Left: Product images gallery
 * Right: Product info (name, status, price, variants, quantity, actions)
 */
export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const { addItem } = useCart();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Check if product has multi-attribute variants (normalized system)
  const hasMultiAttributeVariants = !!(product as any).options && (product as any).options.length > 0;

  // === MULTI-ATTRIBUTE VARIANT LOGIC ===
  const multiAttrVariantSelection = useVariantSelection(hasMultiAttributeVariants ? (product as any) : null);

  // === LEGACY VARIANT LOGIC ===
  // Sort variants by conversionRate to get smallest unit first (goi = 1)
  const sortedVariants = useMemo(() => {
    return product.variants?.slice().sort((a, b) => a.conversionRate - b.conversionRate);
  }, [product.variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    sortedVariants?.[0]?.id || null
  );

  const legacySelectedVariant = sortedVariants?.find(
    (v: ProductVariant) => v.id === selectedVariantId
  );

  // === SHARED STATE ===
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  // Determine active variant and price based on variant system
  const selectedVariant = hasMultiAttributeVariants
    ? multiAttrVariantSelection?.selectedVariant
    : legacySelectedVariant;

  const displayPrice = selectedVariant?.price ?? product.price;
  // Only calculate pricePerUnit for legacy variants (not multi-attribute)
  const pricePerUnit = !hasMultiAttributeVariants && legacySelectedVariant
    ? calculatePricePerUnit(legacySelectedVariant.price, legacySelectedVariant.conversionRate)
    : null;

  // Determine if product has variants and check stock accordingly
  const hasVariants = hasMultiAttributeVariants || (sortedVariants && sortedVariants.length > 0);
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock === 0;

  // Validation: If product has variants, variant must be selected
  const canAddToCart = hasMultiAttributeVariants
    ? multiAttrVariantSelection?.isComplete ?? false
    : (hasVariants ? selectedVariantId !== null : true);

  const handleAddToCart = () => {
    if (!canAddToCart) {
      console.error('Cannot add to cart', { hasMultiAttributeVariants, canAddToCart });
      return;
    }

    setIsAdding(true);

    // Add to cart with appropriate data based on variant system
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      attributes: hasMultiAttributeVariants ? multiAttrVariantSelection?.selectedAttributes : undefined,
      quantity,
    });

    // Show success feedback
    setShowAdded(true);
    setTimeout(() => {
      setShowAdded(false);
      setIsAdding(false);
    }, 2000);
  };

  // Reset state when dialog/drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to default when closing
      setSelectedVariantId(sortedVariants?.[0]?.id || null);
      setQuantity(1);
      setShowAdded(false);
      setIsAdding(false);
      // Reset multi-attribute selection to defaults
      if (hasMultiAttributeVariants && multiAttrVariantSelection?.reset) {
        multiAttrVariantSelection.reset();
      }
    }
    onOpenChange(newOpen);
  };

  // Extract image URLs (handle both string[] and object[] formats)
  const getImageUrls = (): string[] => {
    if (!product.images || product.images.length === 0) return [];
    const images = product.images as any[];
    return images.map(img => {
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && img?.url) return img.url;
      return '';
    }).filter(url => url !== '');
  };

  const imageUrls = getImageUrls();

  // Render shared content for both Dialog and Drawer
  const renderProductContent = (isDrawer: boolean = false) => (
    <div className={cn(
      "grid gap-0",
      isDesktop ? "md:grid-cols-2" : "grid-cols-1",
      isDrawer && "overflow-y-auto"
    )}>
      {/* Left Column - Product Images */}
      <div className="bg-gray-50 p-6 md:p-8">
        <ProductImageGallery
          images={imageUrls}
          productName={product.name}
          isModal={true}
        />
      </div>

      {/* Right Column - Product Info */}
      <div className="p-6 md:p-8 flex flex-col gap-4 max-h-[80vh]">
        <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tình trạng:</span>
          {!isOutOfStock ? (
            <span className="text-sm font-medium text-primary">Còn hàng</span>
          ) : (
            <span className="text-sm font-medium text-red-600">Hết hàng</span>
          )}
        </div>

        <Separator />

        {/* Price */}
        <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg">
          <div className="flex gap-3 items-baseline sm:items-center">
            <span className="text-base hidden sm:block text-black w-24">Giá:</span>
            {hasMultiAttributeVariants ? (
              <VariantPriceDisplay
                product={product as any}
                selectedVariant={selectedVariant as any}
                showRange={false}
              />
            ) : (
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
            )}
          </div>
          {pricePerUnit && legacySelectedVariant && legacySelectedVariant.conversionRate > 1 && (
            <span className="text-sm text-gray-500 ml-12">
              ({formatCurrency(pricePerUnit)}/gói)
            </span>
          )}
        </div>

        {/* Variants */}
        {hasMultiAttributeVariants ? (
          // Multi-attribute variants: Use VariantSelector
          <VariantSelector
            options={(product as any).options}
            selectedAttributes={multiAttrVariantSelection?.selectedAttributes ?? {}}
            onSelect={multiAttrVariantSelection?.selectAttribute ?? (() => { })}
            getAvailableValues={multiAttrVariantSelection?.getAvailableValues ?? (() => new Set())}
            isValueSelected={multiAttrVariantSelection?.isValueSelected ?? (() => false)}
            isValueAvailable={multiAttrVariantSelection?.isValueAvailable ?? (() => true)}
          />
        ) : sortedVariants && sortedVariants.length > 0 && (
          // Legacy single-attribute variants: Use button list
          <div className="flex flex-col gap-3">
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

        {/* Quantity Selector */}
        <div className="hidden md:flex flex-col gap-2">
          <span className="text-base font-semibold text-gray-900">Số lượng:</span>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={setQuantity}
            max={currentStock}
          />
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex flex-col gap-3 pt-2">
          <Button
            className="w-full h-12 text-base font-bold rounded-full shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-white"
            onClick={handleAddToCart}
            disabled={isOutOfStock || !canAddToCart || isAdding}
          >
            {showAdded ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Đã thêm vào giỏ
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" />
                THÊM VÀO GIỎ HÀNG
              </>
            )}
          </Button>
        </div>
        <MobileProductCTA
          product={product}
          selectedVariant={selectedVariant as any}
          hasVariants={!!hasVariants}
          canAddToCart={canAddToCart}
          isOutOfStock={isOutOfStock}
          currentStock={currentStock}
          onClose={() => handleOpenChange(false)}
        />
        {/* Link to Product Detail */}
        <Link
          href={`/products/${product.slug}`}
          onClick={() => handleOpenChange(false)}
          className="w-full mb-10 text-left"
        >
          <span className="underline text-sm flex items-center gap-1 mt-2 mb-8">
            Xem chi tiết sản phẩm
            <Link2 className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );

  // Desktop: Use Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-6xl p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          {renderProductContent(false)}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Drawer
  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>{product.name}</DrawerTitle>
          <DrawerDescription>
            hnumarket.com
          </DrawerDescription>
        </DrawerHeader>
        {renderProductContent(true)}
      </DrawerContent>
    </Drawer>
  );
}
