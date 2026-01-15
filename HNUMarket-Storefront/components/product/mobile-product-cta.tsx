"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { useCart } from "@/contexts/cart-context";
import { useMobileCartDrawer } from "@/contexts/mobile-cart-drawer-provider";
import { Button } from "@/components/ui/button";

interface MobileProductCTAProps {
    product: Product;
    selectedVariant: ProductVariant | undefined;
    hasVariants: boolean;
    canAddToCart: boolean;
    isOutOfStock: boolean;
    currentStock: number;
    /** Có cart bar đang hiển thị không - để điều chỉnh bottom offset */
    hasCartBar?: boolean;
    /** Callback để đóng modal/drawer khi thêm vào giỏ hàng */
    onClose?: () => void;
}

/**
 * Nút CTA cố định trên mobile cho trang product-info
 * Bao gồm quantity selector và nút "Thêm vào giỏ hàng"
 */
export function MobileProductCTA({
    product,
    selectedVariant,
    hasVariants,
    canAddToCart,
    isOutOfStock,
    currentStock,
    hasCartBar = false,
    onClose,
}: MobileProductCTAProps) {
    const { addItem } = useCart();
    const { openDrawer } = useMobileCartDrawer();
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showAdded, setShowAdded] = useState(false);

    const handleQuantityDecrease = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleQuantityIncrease = () => {
        if (quantity < currentStock) {
            setQuantity(quantity + 1);
        }
    };

    const handleAddToCart = () => {
        // Defensive validation: ensure variant is selected when product has variants
        if (hasVariants && !selectedVariant) {
            console.error('Cannot add to cart: variant must be selected');
            return;
        }

        setIsAdding(true);
        addItem({
            productId: product.id,
            variantId: selectedVariant?.id || undefined,
            quantity,
        });

        // Show success feedback
        setShowAdded(true);
        setTimeout(() => {
            setShowAdded(false);
            setIsAdding(false);
            // Reset quantity after adding
            setQuantity(1);
        }, 500);

        // Close modal/drawer if onClose callback is provided
        if (onClose) {
            setTimeout(() => {
                onClose();
            }, 300);
        }

        // Open drawer after a short delay
        setTimeout(() => {
            openDrawer();
        }, 300);
    };

    return (
        <div
            className={`
        fixed left-0 right-0 z-50 bg-white border-t border-gray-200
        flex items-center gap-3 px-4 py-3
        shadow-[0_-4px_12px_rgba(0,0,0,0.1)]
        md:hidden
        bottom-0
      `}
            style={{
                paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
                transform: hasCartBar ? "translateY(-52px)" : "none",
            }}
        >
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-full bg-gray-50">
                <button
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-40 rounded-l-full"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-base font-semibold">{quantity}</span>
                <button
                    onClick={handleQuantityIncrease}
                    disabled={quantity >= currentStock}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 disabled:opacity-40 rounded-r-full"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Add to Cart Button */}
            <Button
                className="flex-1 h-12 text-base font-bold rounded-full shadow-md bg-primary hover:bg-primary/90 text-white"
                onClick={handleAddToCart}
                disabled={isOutOfStock || !canAddToCart || isAdding}
            >
                {showAdded ? (
                    <>
                        <Check className="mr-2 h-5 w-5" />
                        Đã thêm
                    </>
                ) : (
                    <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        THÊM VÀO GIỎ HÀNG
                    </>
                )}
            </Button>
        </div>
    );
}
